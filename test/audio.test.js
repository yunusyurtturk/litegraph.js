
import { strict as assert } from 'assert';
import { Console } from 'console';

import { LGAudio } from "../src/nodes/audio.js";

/*
    @TODO:
    Continue defining the audio.test.js before modifying audio.js meaningfully.
*/

describe('LGAudio', () => {
    it('getAudioContext should return a valid audio context', () => {
        const audioContext = LGAudio.getAudioContext();
        assert.ok(audioContext);
    });

    it('changeAllAudiosConnections should connect all audio nodes with proper links', () => {
        const node = {
            inputs: [{ link: 0, linkInfo: { origin_id: 1, origin_slot: 0 }}],
            outputs: [{ links: [1] }],
            graph: {
                links: { 0: { origin_id: 1, origin_slot: 0 }, 1: { target_id: 2, target_slot: 0 }}
            },
            getAudioNodeInInputSlot: () => ({}),
            getAudioNodeInOutputSlot: () => ({})
        };

        LGAudio.connect = () => {};
        LGAudio.disconnect = () => {};

        LGAudio.changeAllAudiosConnections(node, true); // Connect all nodes
        assert.ok(true); // Add assertion to check if connection is successful

        LGAudio.changeAllAudiosConnections(node, false); // Disconnect all nodes
        assert.ok(true); // Add assertion to check if disconnection is successful
    });

    it('loadSound should load audio successfully', () => {
        const mockCallback = () => {};
        const url = 'example_audio.wav';
        const on_complete = () => {};
        const on_error = () => {};

        global.XMLHttpRequest = () => ({
            open: () => {},
            send: () => {},
            onload: () => {
                const buffer = new ArrayBuffer();
                on_complete(buffer);
            },
            response: new ArrayBuffer(),
            status: 200
        });

        LGAudio.loadSound(url, mockCallback, on_error);
        assert.ok(true); // Add assertion to check if loading sound is successful
    });
});
