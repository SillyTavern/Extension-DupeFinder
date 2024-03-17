/* eslint-disable no-restricted-globals */

import * as levenshtein from 'fastest-levenshtein';
import cluster from 'set-clustering';

const allowedKeys = new Set([
    'name',
    'description',
    'scenario',
    'personality',
    'first_mes',
    'mes_example',
]);

function similarity(x, y) {
    let score = 0;
    let matchedKeys = 0;

    for (const key of allowedKeys) {
        const value1 = x.data[key] || '';
        const value2 = y.data[key] || '';

        if (value1 === '' || value2 === '') {
            continue;
        }

        let s = levenshtein.distance(value1, value2);
        let maxLen = Math.max(value1.length, value2.length);
        let normalizedDistance = s / maxLen;
        let similarity = 1 - normalizedDistance;
        score += similarity;
        matchedKeys++;
    }

    if (matchedKeys === 0) {
        return 0;
    }

    return score / matchedKeys;
}

self.onmessage = function ({ data: { threshold, characters } }) {
    const totalRuns = characters.length * (characters.length - 1);
    let run = 0;
    let percent = 0;
    const clusters = cluster(characters, (x,y) => {
        const newPercent = Math.round((run++ / totalRuns) * 100);
        if (newPercent !== percent) {
            percent = newPercent;
            self.postMessage({ type: 'progress', data: { percent: newPercent, run, totalRuns } });
        }
        return similarity(x,y)
    });
    const groups = clusters.similarGroups(threshold);
    self.postMessage({ type: 'result', data: groups });
}
