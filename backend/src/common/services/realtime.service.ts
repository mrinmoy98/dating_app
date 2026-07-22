import { Injectable } from '@nestjs/common';

/**
 * Bridge between plain HTTP controllers and the Socket.IO gateway.
 *
 * The gateway owns the socket server and the presence map, but REST endpoints
 * (e.g. sending a chat message as multipart/form-data) also need to push live
 * events and ask "is this user online?". The gateway registers itself here on
 * boot; anything injected with this service can then reach it without a
 * circular module dependency.
 */
@Injectable()
export class RealtimeService {
  private emitter: ((userId: string, event: string, payload: any) => void) | null = null;
  private presence: ((userId: string) => boolean) | null = null;

  register(
    emitter: (userId: string, event: string, payload: any) => void,
    presence: (userId: string) => boolean,
  ) {
    this.emitter = emitter;
    this.presence = presence;
  }

  emitTo(userId: string, event: string, payload: any) {
    this.emitter?.(String(userId), event, payload);
  }

  /** Emit the same payload to both sides of a conversation. */
  emitToPair(a: string, b: string, event: string, payload: any) {
    this.emitTo(a, event, payload);
    if (String(a) !== String(b)) this.emitTo(b, event, payload);
  }

  isOnline(userId: string): boolean {
    return this.presence ? this.presence(String(userId)) : false;
  }
}
