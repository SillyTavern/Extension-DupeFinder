import { EventEmitter } from 'events';

export const eventEmitter = new EventEmitter();

export const EVENT_NAMES = {
    CLOSE_PANEL: 'closePanel',
    OPEN_PANEL: 'openPanel',
};
