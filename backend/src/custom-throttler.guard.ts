

import { ThrottlerGuard, ThrottlerRequest } from '@nestjs/throttler';
import { Injectable } from '@nestjs/common';

@Injectable()
export class CustomThrottlerGuard extends ThrottlerGuard {
    //   protected async handleRequest(requestProps: ThrottlerRequest): Promise<boolean> {
    //     const { context, limit, ttl } = requestProps;

    //     const req = context.switchToHttp().getRequest();

    //     let newLimit = limit;

    //     // 👇 custom logic
    //     if (req.method === 'POST') {
    //       newLimit = 10;
    //     } else if (req.method === 'GET') {
    //         newLimit = 100;
    //         // console.log('max limit hit... limit:', newLimit)
    //     }

    //     // 👇 IMPORTANT: pass modified limit back
    //     return super.handleRequest({
    //       ...requestProps,
    //       limit: newLimit,
    //       ttl,
    //     });
    //   }

    protected async handleRequest(requestProps: ThrottlerRequest): Promise<boolean> {
        const { context, limit, ttl } = requestProps;

        const req = context.switchToHttp().getRequest();

        let newLimit = limit;

        switch (req.method) {
            case 'GET':
                newLimit = 200; // relaxed
                break;

            case 'POST':
                newLimit = 10; // strict
                break;

            case 'PUT':
            case 'PATCH':
                newLimit = 10; // medium
                break;

            case 'DELETE':
                newLimit = 5; // very strict
                break;

            default:
                newLimit = limit; // fallback
        }

        return super.handleRequest({
            ...requestProps,
            limit: newLimit,
            ttl,
        });
    }
}