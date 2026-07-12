// Exercise: Count even or odd values in an array.
// Goal: Inspect each element and group it by parity.

let values = [1, 2, 3, 4, 5];

function countEvenOdds(values, evenOrOdd) {
    if(values === null)
        return "Array is null.";

    if(values.length === 0)
        return "Array length is 0.";

    let even = 0;
    let odd = 0;

    for(let i = 0; i < values.length; i++) {
        if(values[i] % 2 === 0) {
            even = even + values[i];
        } else {
            odd = odd + values[i];
        }
    }

    return evenOrOdd === "even" ? even : odd;
}

console.log("Count Evens: " + countEvenOdds(values, "even"));
console.log("Count odds: " + countEvenOdds(values, "odd"));

// Time complexity: O(n)
// Space complexity: O(1)