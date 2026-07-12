// Exercise: Reverse an array.
// Goal: Reorder the elements so the first becomes the last and vice versa.

let values = [2, 1, 4, 3, 5];

function reverseArray(values) {
    if(values === null)
        return "Array is null.";

    if(values.length === 0)
        return "Array length is 0.";

    // Approach 1: Sort array first
    // values.sort();
    // for(let i = 0; i < values.length / 2; i++) {
    //     let pointerFront = values[i];
    //     let pointerBack = values[values.length - 1 - i];
    //     values[i] = pointerBack;
    //     values[values.length - 1 - i] = pointerFront;
    // }

    // Approach 2: Sort array is not allowed
    for(let i = 0; i < values.length; i++) {
        for(let j = i + 1; j < values.length; j++) {
            let pointerI = values[i];
            let pointerJ = values[j];
            if(values[i] < values[j]) {
                values[i] = pointerJ;
                values[j] = pointerI;
            }
        }
        console.log(values);
    }

    return values;
}

console.log(reverseArray(values));

// Time complexity: O(n²)
// Space complexity: O(1)