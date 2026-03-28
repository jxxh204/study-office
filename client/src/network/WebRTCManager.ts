import { SocketManager } from './SocketManager';

const ICE_SERVERS: RTCConfiguration = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
  ],
};

export class WebRTCManager {
  private peers: Map<string, RTCPeerConnection> = new Map();
  private localStream: MediaStream | null = null;
  private socket: SocketManager;
  private _muted = true;

  constructor(socket: SocketManager) {
    this.socket = socket;
  }

  get muted(): boolean {
    return this._muted;
  }

  async acquireMic(): Promise<MediaStream> {
    if (this.localStream) return this.localStream;
    this.localStream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
    // Start muted
    this.localStream.getAudioTracks().forEach((t) => (t.enabled = false));
    this._muted = true;
    return this.localStream;
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
    if (this.peers.has(remoteId)) {
      this.peers.get(remoteId)!.close();
    }

    const pc = new RTCPeerConnection(ICE_SERVERS);

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
      console.log(`[WebRTC] ${remoteId} state: ${pc.connectionState}`);
      if (pc.connectionState === 'failed' || pc.connectionState === 'closed') {
        this.closePeer(remoteId);
      }
    };

    this.peers.set(remoteId, pc);
    return pc;
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
    const pc = this.peers.get(fromId);
    if (!pc) return;
    await pc.setRemoteDescription(new RTCSessionDescription(answer));
  }

  async handleIceCandidate(fromId: string, candidate: RTCIceCandidateInit): Promise<void> {
    const pc = this.peers.get(fromId);
    if (!pc) return;
    try {
      await pc.addIceCandidate(new RTCIceCandidate(candidate));
    } catch (e) {
      console.warn('[WebRTC] Failed to add ICE candidate:', e);
    }
  }

  closePeer(remoteId: string): void {
    const pc = this.peers.get(remoteId);
    if (pc) {
      pc.close();
      this.peers.delete(remoteId);
    }
    // Remove audio element
    const audio = document.querySelector(`audio[data-peer="${remoteId}"]`);
    audio?.remove();
  }

  closeAll(): void {
    this.peers.forEach((pc, id) => {
      pc.close();
      const audio = document.querySelector(`audio[data-peer="${id}"]`);
      audio?.remove();
    });
    this.peers.clear();
  }
}
