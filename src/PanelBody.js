/* global SillyTavern */
/* global toastr */
import React from 'react';

const {
    selectCharacterById,
    getThumbnailUrl,
    timestampToMoment,
    eventSource,
    event_types,
} = SillyTavern.getContext();

const SLIDER_VALUE_KEY = 'DupeFinder_similarity_threshold';

function PanelBody() {
    const initialSliderValue = localStorage.getItem(SLIDER_VALUE_KEY) ?? 0.95;

    const [data, setData] = React.useState(null);
    const [sliderValue, setSliderValue] = React.useState(Number(initialSliderValue));
    const [worker, setWorker] = React.useState(null);
    const [progress, setProgress] = React.useState(null);
    const [deletedCharacters, setDeletedCharacters] = React.useState([]);

    React.useEffect(() => {
        eventSource.on(event_types.CHARACTER_DELETED, characterDeleted);

        return () => {
            eventSource.removeListener(event_types.CHARACTER_DELETED, characterDeleted);
        }
    });

    function characterDeleted(args) {
        const avatar = args?.character?.avatar;

        if (!avatar) {
            return;
        }

        setDeletedCharacters(value => [...value, avatar]);
    }

    function refresh() {
        setProgress(0);
        setDeletedCharacters([]);
        const characters = SillyTavern.getContext().characters.slice();
        worker.postMessage({ threshold: sliderValue, characters: characters });
    }

    function onSelectCharacterClick(character) {
        const context = SillyTavern.getContext();
        const characterIndex = context.characters.findIndex(c => c.avatar === character.avatar);
        if (characterIndex !== -1) {
            selectCharacterById(characterIndex);
        } else {
            toastr.error('Character not found');
        }
    }

    React.useEffect(() => {
        const myWorker = new Worker(new URL('./clustering.js', import.meta.url));
        // Set up event listener for messages from the worker
        myWorker.onmessage = function (event) {
            console.debug('Message received from worker', event.data);
            switch (event.data.type) {
                case 'progress':
                    setProgress(event.data.data.percent);
                    break;
                case 'result':
                    setProgress(null);
                    setData(event.data.data);
                    break;
                default:
                    break;
            }
        };

        myWorker.onerror = function (event) {
            console.error('Error received from worker', event);
        }

        // Save the worker instance to state
        setWorker(myWorker);

        // Clean up the worker when the component unmounts
        return () => {
            myWorker.terminate();
        };
    }, []);

    function onSliderUpdate(event) {
        setSliderValue(Number(event.target.value));
        localStorage.setItem(SLIDER_VALUE_KEY, event.target.value);
    }

    return (
        <div className="scrollY wide100p padding10">
            <div>
                <h2>Similar Characters</h2>
            </div>
            <div className="flex-container alignItemsCenter">
                <div className="flex-container flexFlowColumn flex1 marginBot10">
                    <label htmlFor="threshold">Similarity threshold: {Number(sliderValue).toFixed(2)}</label>
                    <input name="threshold" type="range" min="0" max="1" step="0.01" value={sliderValue} onChange={onSliderUpdate} />
                    <div class="slider_hint">
                        <span>Any match</span>
                        <span>&nbsp;</span>
                        <span>Exact match</span>
                    </div>
                </div>
                <div className="flex1">&nbsp;</div>
                <div className="menu_button menu_button_icon" onClick={() => refresh()}>
                    <i class="fa-solid fa-sync"></i>
                    <span>Calculate</span>
                </div>
            </div>

            {
                !Array.isArray(data) && progress === null && (
                    <div className="textAlignCenter">
                        <h3>Instructions</h3>
                        <p>Use the slider to set the similarity threshold and click the "Calculate" button to see the similar characters.</p>
                        <p><strong>Warning:</strong> This operation can take several minutes to complete.</p>
                    </div>
                )
            }

            {
                progress !== null && (
                    <div className="textAlignCenter">
                        <h3>Calculating...</h3>
                        <progress className="wide100p" value={progress} max="100"></progress>
                    </div>
                )
            }

            {
                progress == null && Array.isArray(data) && data.length === 0 && (
                    <div className="textAlignCenter">
                        <h3>No characters found</h3>
                    </div>
                )
            }

            {
                progress == null && Array.isArray(data) && data.length > 0 && data.filter(x => Array.isArray(x) && x.length > 1).length === 0 && (
                    <div className="textAlignCenter">
                        <h3>No similar characters found</h3>
                    </div>
                )
            }

            {
                Array.isArray(data) && data.length > 0 && data.filter(x => Array.isArray(x) && x.length > 1).map((group, index) => {
                    return (
                        <div key={index}>
                            <div class="flex-container flexFlowColumn">
                                {group.map((character, index) => {
                                    return (
                                        <div className={"flex-container alignItemsCenter flexGap10" + (deletedCharacters.includes(character.avatar) ? " grayscale opacity50p" : "")} key={index}>
                                            <div>
                                                <div className="avatar">
                                                    <img src={getThumbnailUrl('avatar', character.avatar)} alt={character.name} />
                                                </div>
                                            </div>
                                            <div className="flex1 flex-container flexFlowColumn flexNoGap">
                                                <div className="flex-container flexGap10 alignItemsBaseline">
                                                    <strong>{character.name}</strong>
                                                    <small>{character.avatar}</small>
                                                </div>
                                                <div className="flex-container flexFlowColumn fontsize80p flexNoGap">
                                                    <span>Created: {timestampToMoment(character.create_date).toString('LL LT')}</span>
                                                    <span>Last chat: {timestampToMoment(character.date_last_chat).toString('LL LT')}</span>
                                                </div>
                                            </div>
                                            {
                                                !deletedCharacters.includes(character.avatar) && (
                                                    <div className="menu_button menu_button_icon" onClick={() => onSelectCharacterClick(character)}>
                                                        <i class="fa-solid fa-eye"></i>
                                                        <span>View</span>
                                                    </div>
                                                )
                                            }
                                            {
                                                deletedCharacters.includes(character.avatar) && (
                                                    <div>
                                                        <i class="fa-solid fa-trash"></i>
                                                        <span>&nbsp;</span>
                                                        <i>Deleted</i>
                                                    </div>
                                                )
                                            }
                                        </div>
                                    )
                                })}
                            </div>
                            <hr></hr>
                        </div>
                    );
                })
            }
        </div>
    )
}

export default PanelBody;
