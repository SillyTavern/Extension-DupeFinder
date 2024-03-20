/* global SillyTavern */
const MODULE_NAME = 'DupeFinder';

const {
    extensionSettings,
    saveSettingsDebounced,
} = SillyTavern.getContext();

/** @enum {string} Similarity methods */
const similarity_methods = {
    LEVENSHTEIN: 'levenshtein',
    SENTENCE: 'sentence',
};

export const character_fields = [
    {
        value: 'name',
        label: 'Name',
    },
    {
        value: 'description',
        label: 'Description',
    },
    {
        value: 'scenario',
        label: 'Scenario',
    },
    {
        value: 'personality',
        label: 'Personality',
    },
    {
        value: 'first_mes',
        label: 'First message',
    },
    {
        value: 'mes_example',
        label: 'Examples of dialogue',
    },
    {
        value: 'system_prompt',
        label: 'Main Prompt',
    },
    {
        value: 'post_history_instructions',
        label: 'Jailbreak',
    },
    {
        value: 'creator',
        label: 'Created by',
    },
    {
        value: 'creator_notes',
        label: "Creator's Notes",
    }
];

export const search_methods = [
    {
        value: similarity_methods.SENTENCE,
        label: 'Sentence similarity',
        description: 'Faster, less accurate. Compares the similarity of characters based on the number of matching sentences in their fields'
    },
    {
        value: similarity_methods.LEVENSHTEIN,
        label: 'Levenshtein distance',
        description: 'Slower, more accurate. Compares the similarity of characters based on the Levenshtein distance between their fields'
    },
];

/** @enum {string} Setting keys */
export const SettingKeys = {
    SIMILARITY_THRESHOLD: 'similarity_threshold',
    SIMILARITY_METHOD: 'similarity_method',
    SIMILARITY_FIELDS: 'similarity_fields',
};

/**
 * Utility class to manage the extension settings.
 */
export class SettingsManager {
    constructor() {
        this.#init();
    }

    static default = Object.freeze({
        [SettingKeys.SIMILARITY_THRESHOLD]: 0.95,
        [SettingKeys.SIMILARITY_METHOD]: similarity_methods.SENTENCE,
        [SettingKeys.SIMILARITY_FIELDS]: [
            'name',
            'description',
            'scenario',
            'personality',
            'first_mes',
            'mes_example',
        ],
    });

    /**
     * Initialize the extension settings.
     */
    #init() {
        if (!extensionSettings[MODULE_NAME]) {
            extensionSettings[MODULE_NAME] = {};
        }

        for (const key of Object.values(SettingKeys)) {
            if (extensionSettings[MODULE_NAME][key] === undefined) {
                extensionSettings[MODULE_NAME][key] = SettingsManager.default[key];
            }
        }
    }

    /**
     * Write a value to the extension settings.
     * @param {SettingKeys} key Setting key
     * @param {any} value Setting value
     */
    write(key, value) {
        extensionSettings[MODULE_NAME][key] = value;
        saveSettingsDebounced();
    }

    /**
     * Read a value from the extension settings.
     * @param {SettingKeys} key Setting key
     * @returns {any} Setting value
     */
    read(key) {
        return extensionSettings[MODULE_NAME][key];
    }
}
