// Exercise: Sum all values in an array.
// Goal: Traverse the array and accumulate each number into a total.

let values = [1, 2, 3, 4, 5];

function sumValues(values) {

    if(values === null)
        return "Array is null.";

    if(values.length === 0)
        return "Array length is 0."

    let sum = 0;

    for(let i = 0; i < values.length; i++) {
        sum = sum + values[i];
    }

    return sum;
}

console.log(sumValues(values));

// Time complexity: O(n)
// Space complexity: O(1)