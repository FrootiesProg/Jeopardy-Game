class TriviaGameShow {
  constructor(element, options = {}) {
    // This constructor initializes the TriviaGameShow object with provided element and options.

    // Which categories we should use (or use default if nothing provided)
    this.useCategoryIds = options.useCategoryIds || [
      1382, 114, 67, 218, 2091, 392, 722, 64, 202, 2639,
    ];
    // Database
    this.categories = [];
    this.clues = {};

    // State
    this.currentClue = null;
    this.score = 0;

    // Elements
    this.boardElement = element.querySelector(".board");
    this.scoreCountElement = element.querySelector(".score-count");
    this.formElement = element.querySelector("form");
    this.formElement.addEventListener("submit", (event) => {
      this.handleFormSubmit(event);
    });

    this.inputElement = element.querySelector("input[name=user-answer]");
    this.modalElement = element.querySelector(".card-modal");
    this.clueTextElement = element.querySelector(".clue-text");
    this.resultElement = element.querySelector(".result");
    this.resultTextElement = element.querySelector(
      ".result_correct-answer-text"
    );
    this.successTextElement = element.querySelector(".result_success");
    this.failTextElement = element.querySelector(".result_fail");
    this.startButtonElement = element.querySelector(".start-button");
    this.restartButtonElement = element.querySelector(".restart-button");
  }

  initGame() {
    //  Initializes the game by binding event handlers to start and restart buttons.
    this.startButtonElement.addEventListener("click", () => {
      this.startGame();
    });

    this.restartButtonElement.addEventListener("click", () => {
      this.restartGame();
    });
  }

  startGame() {
    //  Starts the game by clearing the board, fetching categories, and displaying the restart button.

    // Clear the existing board
    this.boardElement.innerHTML = "";

    // Fetch categories and render them to the board
    this.fetchCategories();

    // Show the restart button
    this.restartButtonElement.style.display = "inline-block";
  }

  restartGame() {
    //  Restarts the game by resetting the state, clearing the board and categories, and fetching new categories.

    // Reset the game state
    this.currentClue = null;
    this.score = 0;
    this.updateScore(0);

    // Clear the board and categories
    this.boardElement.innerHTML = "";
    this.categories = [];

    // Fetch new categories and render them to the board
    this.fetchCategories();
  }

  fetchCategories() {
    //  Fetches categories from the API and renders them on the board.

    // Shuffle category IDs
    const shuffledCategoryIds = shuffle(this.useCategoryIds);
    // Select first 5 category IDs
    const selectedCategoryIds = shuffledCategoryIds.slice(0, 5);

    const categories = selectedCategoryIds.map((category_id) => {
      return new Promise((resolve, reject) => {
        fetch(`https://jservice.io/api/category?id=${category_id}`)
          .then((response) => response.json())
          .then((data) => {
            resolve(data);
          });
      });
    });

    Promise.all(categories).then((results) => {
      results.forEach((result, categoryIndex) => {
        var category = {
          title: result.title,
          clues: [],
        };

        shuffle(result.clues)
          .splice(0, 5)
          .forEach((clue, index) => {
            var clueId = categoryIndex + "-" + index;
            category.clues.push(clueId);

            this.clues[clueId] = {
              question: clue.question,
              answer: clue.answer,
              value: (index + 1) * 100,
            };
          });

        this.categories.push(category);
      });

      this.categories.forEach((c) => {
        this.renderCategory(c);
      });

      this.startButtonElement.style.display = "none";
    });
  }

  renderCategory(category) {
    // Renders a category and its associated clues on the board.

    let column = document.createElement("div");
    column.classList.add("column");
    column.innerHTML = `<header>${category.title}</header>
      <ul>
      </ul>`.trim();

    var ul = column.querySelector("ul");
    category.clues.forEach((clueId) => {
      var clue = this.clues[clueId];
      var button = document.createElement("button");
      button.dataset.clueId = clueId;
      button.textContent = clue.value;
      button.addEventListener("click", (event) => {
        this.handleClueClick(event);
      });
      ul.appendChild(document.createElement("li")).appendChild(button);
    });

    this.boardElement.appendChild(column);
  }

  updateScore(change) {
    // Updates the score by adding the change value.
    this.score += change;
    this.scoreCountElement.textContent = this.score;
  }

  handleClueClick(event) {
    //  Handles the click event on a clue button, showing the clue modal and setting the current clue.
    var clue = this.clues[event.target.dataset.clueId];

    event.target.classList.add("used");

    this.inputElement.value = "";
    this.currentClue = clue;
    this.clueTextElement.textContent = this.currentClue.question;
    this.resultTextElement.textContent = this.currentClue.answer;

    this.modalElement.classList.remove("showing-result");
    this.modalElement.classList.add("visible");
    this.inputElement.focus();
  }

  handleFormSubmit(event) {
    // Handles the form submission, checks the answer, updates the score, and reveals the answer.
    event.preventDefault();

    var isCorrect =
      this.cleanseAnswer(this.inputElement.value) ===
      this.cleanseAnswer(this.currentClue.answer);
    if (isCorrect) {
      this.updateScore(this.currentClue.value);
    }

    this.revealAnswer(isCorrect);
  }

  cleanseAnswer(input = "") {
    // Cleanses the user's answer by removing unnecessary characters and converting to lowercase. Help standerize and normalize users answer to improve it.
    var friendlyAnswer = input.toLowerCase(); // line converts the user's answer to lowercase.
    friendlyAnswer = friendlyAnswer.replace("<i>", ""); // line removes any "<i>" tags from the user's answer.
    friendlyAnswer = friendlyAnswer.replace("</i>", ""); // this line removes the closing "</i>" tag from the user's answer if present.
    friendlyAnswer = friendlyAnswer.replace(/ /g, ""); // line removes all spaces from the user's answer
    friendlyAnswer = friendlyAnswer.replace(/"/g, ""); //  line removes double quotation marks (") from the user's answer.
    friendlyAnswer = friendlyAnswer.replace(/^a /, ""); //  line removes the prefix "a " from the user's answer if it exists.
    friendlyAnswer = friendlyAnswer.replace(/^an /, ""); // this line removes the prefix "an " from the user's answer if it exists.
    return friendlyAnswer.trim(); // this line removes any leading or trailing whitespace from the user's answer using the trim() method.
  }

  revealAnswer(isCorrect) {
    //  Reveals the answer in the clue modal, shows success or fail message, and resets the modal after a delay.
    this.successTextElement.style.display = isCorrect ? "block" : "none";
    this.failTextElement.style.display = !isCorrect ? "block" : "none";

    this.modalElement.classList.add("showing-result");

    setTimeout(() => {
      this.modalElement.classList.remove("visible");
      this.currentClue = null;
      this.inputElement.value = "";
      this.modalElement.classList.remove("showing-result");
      this.inputElement.focus();
    }, 3000);
  }
}

// Shuffles an array usingthe Fisher-Yates algorithm.
function shuffle(a) {
  var j, x, i;
  for (i = a.length - 1; i > 0; i--) {
    j = Math.floor(Math.random() * (i + 1));
    x = a[i];
    a[i] = a[j];
    a[j] = x;
  }
  return a;
}

const game = new TriviaGameShow(document.querySelector(".app"), {});
game.initGame();

// 1. The constructor method initializes the `TriviaGameShow` object. It takes an `element` and `options` parameter, with `options` defaulting to an empty object `{}`. The constructor sets up various properties and initializes the game state.

// 2. The `initGame()` method initializes the game by binding event handlers to the start and restart buttons. It adds click event listeners to the start and restart buttons, calling the respective methods (`startGame()` and `restartGame()`) when clicked.

// 3. The `startGame()` method is called when the start button is clicked. It clears the existing board, fetches categories, and displays the restart button.

// 4. The `restartGame()` method is called when the restart button is clicked. It resets the game state, clears the board and categories, and fetches new categories.

// 5. The `fetchCategories()` method fetches categories from the API and renders them on the board. It shuffles the category IDs, selects the first 5 IDs, and makes API requests for each category. Once the API responses are received, the categories and clues are processed, and the corresponding HTML elements are created and appended to the board.

// 6. The `renderCategory(category)` method renders a category and its associated clues on the board. It creates the necessary HTML elements, such as `<div>`, `<header>`, `<ul>`, and `<button>`, and adds event listeners to the clue buttons.

// 7. The `updateScore(change)` method updates the score by adding the `change` value to the current score. It also updates the score count element in the UI.

// 8. The `handleClueClick(event)` method handles the click event on a clue button. It sets the current clue, updates the UI, and shows the clue modal with the question and answer.

// 9. The `handleFormSubmit(event)` method handles the form submission when the user submits their answer. It checks if the user's answer is correct, updates the score if necessary, and reveals the answer in the clue modal.

// 10. The `cleanseAnswer(input)` method cleanses the user's answer by removing unnecessary characters and converting it to lowercase. It removes "<i>" tags, spaces, double quotation marks, and article prefixes like "a" or "an". It trims leading and trailing whitespace.

// 11. The `revealAnswer(isCorrect)` method reveals the answer in the clue modal, shows a success or fail message, and resets the modal after a delay. It toggles the visibility of the success and fail text elements and applies CSS classes to show or hide the modal and result messages.

// 12. The `shuffle(a)` function shuffles an array using the Fisher-Yates algorithm. It iterates over the array and swaps each element with a randomly chosen element from the remaining unshuffled portion of the array.
