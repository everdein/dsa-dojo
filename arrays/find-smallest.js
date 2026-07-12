// Exercise: Find the smallest value in an array.
// Goal: Walk through the array and track the minimum value encountered.

// let numbers = [4, 3, -2, 1, 10];
let numbers = [];

function findSmallest(values) {
    if(numbers.length === null)
        return "The array is null."
    if(numbers.length === 0)
        return "The length of the array is 0.";

    let smallest = values[0];

    for(let i = 0; i < values.length; i++) { 
        if(smallest > values[i])
            smallest = values[i];
    }

    return smallest;
}

console.log(findSmallest(numbers));

// Time complexity: O(n)
// Space complexity: O(1)