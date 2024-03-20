# Duplicate Finder

Adds an ability to cluster characters by similarity groups to easily find duplicates.

## How to use

1. Install the extension using a built-in installer.
2. Find a new button in the character list view, left to a search bar. A modal window will open after you click it.
3. There you can adjust the similarity threshold - the higher the number, the more "similar" the character cards should be to get grouped together.
4. Select desired search method. Sentence similarity is less accurate but fast, Levenshtein distance is very slow but accurate.
5. Click "Calculate" to run the search. This may take some time, especially on large character libraries.
6. If any of the character clusters match the search criteria, they will be displayed in a list. You can click the "View" button to open a chosen character.

## Prerequisites

SillyTavern - latest `staging` version preferred, or stable release >= 1.11.7.

This *won't* work on any older versions.

## What fields are evaluated in the search?

By default, only the V1 character card fields are getting checked:

* Name
* Description
* First message
* Personality
* Scenario
* Examples of dialogue

You can include V2 card fields with the "Configure Fields" option.

## Why the heck it takes so long?

Be patient.

## License and credits

Initial idea and implementation by @Cohee1207

Sentence similarity method by @sinnerai

License: AGPLv3
