import React from 'react';
import { eventEmitter, EVENT_NAMES } from './events';

function PanelHeader() {
    function closePanel() {
        eventEmitter.emit(EVENT_NAMES.CLOSE_PANEL);
    }

    return (
        <div class="panelControlBar flex-container">
            <div id="dupeFinderHeader" class="fa-solid fa-grip drag-grabber"></div>
            <div id="dupeFinderClose" onClick={() => closePanel()} class="fa-solid fa-circle-xmark floating_panel_close"></div>
        </div>
    );
}

export default PanelHeader;
