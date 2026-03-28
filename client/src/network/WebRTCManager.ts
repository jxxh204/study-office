import { SocketManager } from './SocketManager';

const ICE_SERVERS: RTCConfiguration = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
  ],
};

const MAX_RECONNECT_DELAY = 30000; // 30 seconds
const INITIAL_RECONNECT_DELAY = 1000; // 1 second
const CONNECTION_TIMEOUT = 15000; // 15 seconds

export type MicState = 'granted' | 'denied' | 'prompt' | 'no-device';

interface PeerConnectionState {
  pc: RTCPeerConnection;
  connectionState: RTCPeerConnectionState;
  reconnectDelay: number;
  reconnectTimeout?: number;
  connectionTimeout?: number;
}

export class WebRTCManager {
  private peers: Map<string, PeerConnectionState> = new Map();
  private localStream: MediaStream | null = null;
  private socket: SocketManager;
  private _muted = true;
  private _micState: MicState = 'prompt';
  private onConnectionStateChange?: (peerId: string, state: RTCPeerConnectionState) => void;

  constructor(socket: SocketManager) {
    this.socket = socket;
  }

  get muted(): boolean {
    return this._muted;
  }

  get micState(): MicState {
    return this._micState;
  }

  setConnectionStateCallback(callback: (peerId: string, state: RTCPeerConnectionState) => void): void {
    this.onConnectionStateChange = callback;
  }

  async acquireMic(): Promise<MediaStream> {
    if (this.localStream) return this.localStream;

    try {
      this.localStream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
      this._micState = 'granted';
      // Start muted
      this.localStream.getAudioTracks().forEach((t) => (t.enabled = false));
      this._muted = true;
      return this.localStream;
    } catch (error) {
      if (error instanceof DOMException) {
        if (error.name === 'NotAllowedError') {
          this._micState = 'denied';
          throw new Error('PERMISSION_DENIED');
        } else if (error.name === 'NotFoundError') {
          this._micState = 'no-device';
          throw new Error('NO_DEVICE');
        }
      }
      this._micState = 'denied';
      throw error;
    }
  }

  toggleMute(): boolean {
    if (!this.localStream) return true;
    this._muted = !this._muted;
    this.localStream.getAudioTracks().forEach((t) => (t.enabled = !this._muted));
    return this._muted;
  }

  private async ensureStream(): Promise<MediaStream> {
    return this.localStream ?? this.acquireMic();
  }

  private createPeerConnection(remoteId: string): RTCPeerConnection {
    // Clean up existing connection
    if (this.peers.has(remoteId)) {
      this.cleanupPeerState(remoteId);
    }

    const pc = new RTCPeerConnection(ICE_SERVERS);

    const peerState: PeerConnectionState = {
      pc,
      connectionState: 'new',
      reconnectDelay: INITIAL_RECONNECT_DELAY,
    };

    // Start connection timeout
    peerState.connectionTimeout = setTimeout(() => {
      if (pc.connectionState === 'connecting' || pc.connectionState === 'new') {
        console.warn(`[WebRTC] ${remoteId} connection timeout, attempting restart`);
        this.restartIceConnection(remoteId);
      }
    }, CONNECTION_TIMEOUT);

    pc.onicecandidate = (event) => {
      if (event.candidate) {
        this.socket.emit('webrtc-ice-candidate', {
          target: remoteId,
          candidate: event.candidate.toJSON(),
        });
      }
    };

    pc.ontrack = (event) => {
      // Play remote audio
      const audio = new Audio();
      audio.srcObject = event.streams[0];
      audio.autoplay = true;
      audio.setAttribute('data-peer', remoteId);
      document.body.appendChild(audio);
    };

    pc.onconnectionstatechange = () => {
      const state = pc.connectionState;
      console.log(`[WebRTC] ${remoteId} state: ${state}`);
      
      peerState.connectionState = state;
      this.onConnectionStateChange?.(remoteId, state);

      // Clear connection timeout on successful connection
      if (state === 'connected') {
        if (peerState.connectionTimeout) {
          clearTimeout(peerState.connectionTimeout);
          peerState.connectionTimeout = undefined;
        }
        // Reset reconnect delay on successful connection
        peerState.reconnectDelay = INITIAL_RECONNECT_DELAY;
      }

      // Handle failed or disconnected states
      if (state === 'failed' || state === 'disconnected') {
        if (peerState.connectionTimeout) {
          clearTimeout(peerState.connectionTimeout);
          peerState.connectionTimeout = undefined;
        }

        // Attempt ICE restart with exponential backoff
        if (!peerState.reconnectTimeout) {
          peerState.reconnectTimeout = setTimeout(() => {
            if (this.peers.has(remoteId)) {
              console.log(`[WebRTC] Attempting reconnect to ${remoteId} (delay: ${peerState.reconnectDelay}ms)`);
              this.restartIceConnection(remoteId);
              
              // Exponential backoff: double the delay, max 30s
              peerState.reconnectDelay = Math.min(peerState.reconnectDelay * 2, MAX_RECONNECT_DELAY);
            }
          }, peerState.reconnectDelay);
        }
      }

      // Clean up on closed
      if (state === 'closed') {
        this.closePeer(remoteId);
      }
    };

    this.peers.set(remoteId, peerState);
    return pc;
  }

  private async restartIceConnection(remoteId: string): Promise<void> {
    const peerState = this.peers.get(remoteId);
    if (!peerState) return;

    const pc = peerState.pc;
    try {
      // Create new offer with iceRestart
      const offer = await pc.createOffer({ iceRestart: true });
      await pc.setLocalDescription(offer);

      this.socket.emit('webrtc-offer', {
        target: remoteId,
        offer: pc.localDescription!.toJSON(),
      });

      console.log(`[WebRTC] ICE restart initiated for ${remoteId}`);
    } catch (error) {
      console.error(`[WebRTC] Failed to restart ICE for ${remoteId}:`, error);
    }
  }

  private cleanupPeerState(remoteId: string): void {
    const peerState = this.peers.get(remoteId);
    if (!peerState) return;

    if (peerState.connectionTimeout) {
      clearTimeout(peerState.connectionTimeout);
    }
    if (peerState.reconnectTimeout) {
      clearTimeout(peerState.reconnectTimeout);
    }

    peerState.pc.close();
    this.peers.delete(remoteId);
  }

  async createOffer(remoteId: string): Promise<void> {
    const stream = await this.ensureStream();
    const pc = this.createPeerConnection(remoteId);
    stream.getTracks().forEach((track) => pc.addTrack(track, stream));

    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);

    this.socket.emit('webrtc-offer', {
      target: remoteId,
      offer: pc.localDescription!.toJSON(),
    });
  }

  async handleOffer(fromId: string, offer: RTCSessionDescriptionInit): Promise<void> {
    const stream = await this.ensureStream();
    const pc = this.createPeerConnection(fromId);
    stream.getTracks().forEach((track) => pc.addTrack(track, stream));

    await pc.setRemoteDescription(new RTCSessionDescription(offer));
    const answer = await pc.createAnswer();
    await pc.setLocalDescription(answer);

    this.socket.emit('webrtc-answer', {
      target: fromId,
      answer: pc.localDescription!.toJSON(),
    });
  }

  async handleAnswer(fromId: string, answer: RTCSessionDescriptionInit): Promise<void> {
    const peerState = this.peers.get(fromId);
    if (!peerState) return;
    await peerState.pc.setRemoteDescription(new RTCSessionDescription(answer));
  }

  async handleIceCandidate(fromId: string, candidate: RTCIceCandidateInit): Promise<void> {
    const peerState = this.peers.get(fromId);
    if (!peerState) return;
    try {
      await peerState.pc.addIceCandidate(new RTCIceCandidate(candidate));
    } catch (e) {
      console.warn('[WebRTC] Failed to add ICE candidate:', e);
    }
  }

  getPeerConnectionState(remoteId: string): RTCPeerConnectionState | null {
    return this.peers.get(remoteId)?.connectionState ?? null;
  }

  closePeer(remoteId: string): void {
    this.cleanupPeerState(remoteId);
    
    // Remove audio element
    const audio = document.querySelector(`audio[data-peer="${remoteId}"]`);
    audio?.remove();
  }

  closeAll(): void {
    this.peers.forEach((_, id) => {
      this.closePeer(id);
    });
    this.peers.clear();
  }
}
