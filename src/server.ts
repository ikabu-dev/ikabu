// Response for Uptime Robot
import http from 'http';

import { env } from '@/config/env';
http.createServer(function (
    _request: http.IncomingMessage,
    response: {
        writeHead: (arg0: number, arg1: { 'Content-Type': string }) => void;
        end: (arg0: string) => void;
    },
) {
    response.writeHead(200, { 'Content-Type': 'text/plain' });
    response.end('Discord bot is active now \n');
}).listen(env.port || 3000);
require('@/infra/logging/log4js');
require('./app/index.js');
