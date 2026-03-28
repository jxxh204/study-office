import { Socket } from 'socket.io';
import { RoomManager } from './RoomManager';

export class SignalingHandler {
  static register(socket: Socket, roomManager: RoomManager): void {
    socket.on('webrtc-offer', (data: { target: string; offer: RTCSessionDescriptionInit }) => {
      if (!roomManager.isInSameRoom(socket.id, data.target)) return;
      socket.to(data.target).emit('webrtc-offer', {
        from: socket.id,
        offer: data.offer,
      });
    });

    socket.on('webrtc-answer', (data: { target: string; answer: RTCSessionDescriptionInit }) => {
      if (!roomManager.isInSameRoom(socket.id, data.target)) return;
      socket.to(data.target).emit('webrtc-answer', {
        from: socket.id,
        answer: data.answer,
      });
    });

    socket.on('webrtc-ice-candidate', (data: { target: string; candidate: RTCIceCandidateInit }) => {
      if (!roomManager.isInSameRoom(socket.id, data.target)) return;
      socket.to(data.target).emit('webrtc-ice-candidate', {
        from: socket.id,
        candidate: data.candidate,
      });
    });
  }
}
