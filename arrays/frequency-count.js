// Exercise: Count frequency of each element.
// Goal: Track how many times each value appears in the array.

const values = [1, 2, 2, 3, 1, 1];

function countFrequencies(values) {
    if(values === null)
        return "Array is null."

    if(values.length === 0)
        return "The length of the array is 0."


    const object = {};

    // object[key] = value;
    // object[key]++;
    // Object.hasOwn(object, key);
    // Object.keys(object);
    // Object.values(object);
    // Object.entries(object);
    // delete object[key];

    let frequencies = {};

    for(let i = 0; i < values.length; i++) {
        const currentValue = values[i];
        if(Object.hasOwn(frequencies, currentValue)) {
            frequencies[currentValue]++;
        } else {
            frequencies[currentValue] = 1;
        }
    }

    return frequencies;
}

console.log(countFrequencies(values));

// Time complexity: O(n)
// Space complexity: O(k)