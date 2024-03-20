/* global SillyTavern */
/* global toastr */
import React from 'react';
import { SettingsManager, SettingKeys, search_methods, character_fields } from './SettingsManager';

const {
    selectCharacterById,
    getThumbnailUrl,
    timestampToMoment,
    eventSource,
    event_types,
} = SillyTavern.getContext();

function PanelBody() {
    const settingsManager = new SettingsManager();
    const initialSliderValue = settingsManager.read(SettingKeys.SIMILARITY_THRESHOLD);
    const initialMethod = settingsManager.read(SettingKeys.SIMILARITY_METHOD);
    const initialFields = settingsManager.read(SettingKeys.SIMILARITY_FIELDS);

    const [sliderValue, setSliderValue] = React.useState(Number(initialSliderValue));
    const [method, setMethod] = React.useState(initialMethod);
    const [fields, setFields] = React.useState(initialFields);
    const [worker, setWorker] = React.useState(null);
    const [progress, setProgress] = React.useState(null);
    const [deletedCharacters, setDeletedCharacters] = React.useState([]);
    const [data, setData] = React.useState(null);
    const [isOpenFieldsPanel, setIsOpenFieldsPanel] = React.useState(false);

    React.useEffect(() => {
        eventSource.on(event_types.CHARACTER_DELETED, characterDeleted);

        return () => {
            eventSource.removeListener(event_types.CHARACTER_DELETED, characterDeleted);
        }
    });

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
        const args = {
            threshold: sliderValue,
            characters: characters,
            method: method,
            fields: fields,
        };
        worker.postMessage(args);
    }

    function onSelectMethodClick(method) {
        setMethod(method);
        settingsManager.write(SettingKeys.SIMILARITY_METHOD, method);
    }

    function onSliderUpdate(event) {
        const value = Number(event.target.value);
        setSliderValue(value);
        settingsManager.write(SettingKeys.SIMILARITY_THRESHOLD, value);
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

    function onFieldChange(field) {
        if (fields.includes(field)) {
            setFields(fields.filter(x => x !== field));
        } else {
            setFields([...fields, field]);
        }

        settingsManager.write(SettingKeys.SIMILARITY_FIELDS, fields);
    }

    function toggleFieldsPanel() {
        setIsOpenFieldsPanel(value => !value);
    }

    return (
        <div className="scrollY wide100p padding10">
            <div>
                <h2>Similar Characters</h2>
            </div>
            <div className="flex-container alignItemsCenter marginBot5">
                <div className="flex-container flexFlowColumn flex1">
                    <label htmlFor="method">Similarity detection method:</label>
                    {
                        search_methods.map((item, index) => {
                            return (
                                <label key={index} htmlFor={"similarity_method_" + item.value} className="checkbox_label alignItemsCenter">
                                    <input type="radio" id={"similarity_method_" + item.value} value={item.value} checked={method === item.value} onChange={() => onSelectMethodClick(item.value)} />
                                    <span>{item.label}</span>
                                    <i class="fa-solid fa-info-circle" title={item.description}></i>
                                </label>
                            );
                        })
                    }
                </div>
                <div className="flex-container flexFlowColumn flex1">
                    <label htmlFor="threshold">Similarity threshold: {Number(sliderValue).toFixed(2)}</label>
                    <input name="threshold" type="range" min="0" max="1" step="0.01" value={sliderValue} onChange={onSliderUpdate} />
                    <div class="slider_hint">
                        <span>Any match</span>
                        <span>&nbsp;</span>
                        <span>Exact match</span>
                    </div>
                </div>
                <div className="flex-container flexFlowColumn flex1 flexNoGap alignItemsFlexEnd">
                    <div className="menu_button menu_button_icon" onClick={() => toggleFieldsPanel()}>
                        <i class="fa-solid fa-list-check"></i>
                        <span>Configure Fields</span>
                    </div>
                    <div className="menu_button menu_button_icon" onClick={() => refresh()}>
                        <i class="fa-solid fa-sync"></i>
                        <span>Calculate</span>
                    </div>
                </div>
            </div>

            {
                isOpenFieldsPanel && (
                    <div className="options-content marginBot5">
                        {
                            character_fields.map((item, index) => {
                                return (
                                    <label key={index} className="checkbox_label list-group-item" htmlFor={"similarity_field_" + item.value}>
                                        <input type="checkbox" id={"similarity_field_" + item.value} checked={fields.includes(item.value)} onChange={() => onFieldChange(item.value)} />
                                        <span>{item.label}</span>
                                    </label>
                                );
                            })
                        }
                    </div>
                )
            }

            {
                !Array.isArray(data) && progress === null && (
                    <div className="textAlignCenter">
                        <h3>Instructions</h3>
                        <p>Use the slider to set the similarity threshold and click the "Calculate" button to see the similar characters.</p>
                        <p><strong>Warning:</strong> This operation may take several minutes to complete.</p>
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
