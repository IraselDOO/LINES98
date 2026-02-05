export const Utils = {
    // Get a random integer between min (inclusive) and max (inclusive)
    randomInt(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    },

    // Pick a random item from an array
    pickRandom(array) {
        return array[Math.floor(Math.random() * array.length)];
    },

    // Delay helper for async/await animations
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
};
