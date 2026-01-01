import { Injectable } from '@nestjs/common';
import { Subject, Observable } from 'rxjs';
import { MessageEvent } from '@nestjs/common';

interface SseClient {
  userId: string;
  subject: Subject<MessageEvent>;
}

@Injectable()
export class SseService {
  private clients = new Map<string, SseClient>();

  /**
   * Add a new SSE client and return an Observable
   * @param clientId Unique client identifier
   * @param userId User ID associated with this client
   * @returns Observable that emits MessageEvents to the client
   */
  addClient(clientId: string, userId: string): Observable<MessageEvent> {
    const subject = new Subject<MessageEvent>();

    this.clients.set(clientId, {
      userId,
      subject,
    });

    // Send initial connection message
    subject.next({
      data: {
        event: 'connected',
        clientId,
        timestamp: new Date().toISOString(),
      },
    });

    return subject.asObservable();
  }

  /**
   * Remove a client when they disconnect
   * @param clientId Client identifier to remove
   */
  removeClient(clientId: string): void {
    const client = this.clients.get(clientId);
    if (client) {
      client.subject.complete();
      this.clients.delete(clientId);
    }
  }

  /**
   * Send event to a specific client
   * @param clientId Client identifier
   * @param event Event name
   * @param data Event data
   */
  sendEventToClient(clientId: string, event: string, data: any): void {
    const client = this.clients.get(clientId);
    if (client) {
      client.subject.next({
        data: {
          event,
          ...data,
        },
      });
    }
  }

  /**
   * Send event to a specific user (all their connected clients)
   * @param userId User ID
   * @param event Event name
   * @param data Event data
   */
  sendEventToUser(userId: string, event: string, data: any): void {
    for (const [clientId, client] of this.clients.entries()) {
      if (client.userId === userId) {
        client.subject.next({
          data: {
            event,
            ...data,
          },
        });
      }
    }
  }

  /**
   * Broadcast event to all connected clients
   * @param event Event name
   * @param data Event data
   */
  broadcast(event: string, data: any): void {
    for (const client of this.clients.values()) {
      client.subject.next({
        data: {
          event,
          ...data,
        },
      });
    }
  }

  /**
   * Send order update to buyer and all sellers of stores in that order
   * @param orderId Order ID
   * @param buyerUserId Buyer's user ID
   * @param sellerUserIds Array of seller user IDs
   * @param orderData Order data to send
   */
  notifyOrderUpdate(
    orderId: string,
    buyerUserId: string,
    sellerUserIds: string[],
    orderData: any,
  ): void {
    // Notify buyer
    this.sendEventToUser(buyerUserId, 'order:updated', {
      orderId,
      ...orderData,
    });

    // Notify all sellers
    sellerUserIds.forEach((sellerId) => {
      this.sendEventToUser(sellerId, 'order:updated', {
        orderId,
        ...orderData,
      });
    });
  }

  /**
   * Send discount activation/deactivation events
   * @param discountId Discount ID
   * @param status Activation status
   * @param discountData Discount data to send
   */
  notifyDiscountStatusChange(
    discountId: string,
    status: 'activated' | 'deactivated',
    discountData: any,
  ): void {
    this.broadcast('discount:statusChanged', {
      discountId,
      status,
      ...discountData,
    });
  }

  /**
   * Get connected client count
   * @returns Number of connected clients
   */
  getClientCount(): number {
    return this.clients.size;
  }
}
