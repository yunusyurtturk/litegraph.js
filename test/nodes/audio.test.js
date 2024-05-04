
require = require('esm')(module);

import { LGAudio } from "./audio.js";

describe('LGAudio', () => {
    test('getAudioContext should return a valid audio context', () => {
        const audioContext = LGAudio.getAudioContext();
        expect(audioContext).toBeDefined();
    });

    test('changeAllAudiosConnections should connect all audio nodes with proper links', () => {
        const node = {
            inputs: [{ link: 0, linkInfo: { origin_id: 1, origin_slot: 0 }}],
            outputs: [{ links: [1] }],
            graph: {
                links: { 0: { origin_id: 1, origin_slot: 0 }, 1: { target_id: 2, target_slot: 0 }}
            },
            getAudioNodeInInputSlot: jest.fn(() => ({})),
            getAudioNodeInOutputSlot: jest.fn(() => ({}))
        };

        LGAudio.connect = jest.fn();
        LGAudio.disconnect = jest.fn();

        LGAudio.changeAllAudiosConnections(node, true); // Connect all nodes
        expect(LGAudio.connect).toHaveBeenCalled();

        LGAudio.changeAllAudiosConnections(node, false); // Disconnect all nodes
        expect(LGAudio.disconnect).toHaveBeenCalled();
    });

    test('loadSound should load audio successfully', () => {
        const mockCallback = jest.fn();
        const url = 'example_audio.wav';
        const on_complete = jest.fn();
        const on_error = jest.fn();

        global.XMLHttpRequest = jest.fn(() => ({
            open: jest.fn(),
            send: jest.fn(),
            onload: () => {
                const buffer = new ArrayBuffer();
                on_complete(buffer);
            },
            response: new ArrayBuffer(),
            status: 200
        }));

        LGAudio.loadSound(url, mockCallback, on_error);
        expect(mockCallback).toHaveBeenCalledTimes(1);
        expect(on_complete).toHaveBeenCalledTimes(1);
    });
});
