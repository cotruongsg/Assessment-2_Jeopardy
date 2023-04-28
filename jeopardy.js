const BASE_API_URL = "https://jservice.io/api/";
const NUM_CATEGORIES = 6;
const NUM_CLUES_PER_CAT = 5;

// categories is the main data structure for the app; it looks like this:

//  [
//    { title: "Math",h
//      clues: [
//        {question: "2+2", answer: 4, showing: null},
//        {question: "1+1", answer: 2, showing: null}
//        ...
//      ],
//    },
//    { title: "Literature",
//      clues: [
//        {question: "Hamlet Author", answer: "Shakespeare", showing: null},
//        {question: "Bell Jar Author", answer: "Plath", showing: null},
//        ...
//      ],
//    },
//    ...
//  ]

let categories = [];

/** Get NUM_CATEGORIES random category from API.
 *
 * Returns array of category ids
 */

async function getCategoryIds() {
  let response = await axios.get(`${BASE_API_URL}categories?count=100`);
  let catIds = response.data.map((c) => c.id);
  const shuffled = [];
  while (shuffled.length < 6) {
    const index = Math.floor(Math.random() * catIds.length);
    const id = catIds[index];
    if (!shuffled.includes(id)) {
      shuffled.push(id);
    }
  }
  return shuffled;
}

/** Return object with data about a category:
 *
 *  Returns { title: "Math", clues: clue-array }
 *
 * Where clue-array is:
 *   [
 *      {question: "Hamlet Author", answer: "Shakespeare", showing: null},
 *      {question: "Bell Jar Author", answer: "Plath", showing: null},
 *      ...
 *   ]
 */

async function getCategory(catId) {
  let response = await axios.get(`${BASE_API_URL}category?id=${catId}`);
  let cat = response.data; // Get all data from response
  let allClues = cat.clues; // Now Get all clues of each Cat object
  // Return an array of object with only limit 5 element from allClues array of object
  // Then use map to create a array of object with only include : question , answer and showing
  let clues = _.sampleSize(allClues, NUM_CLUES_PER_CAT).map((c) => ({
    question: c.question,
    answer: c.answer,
    showing: null,
  }));
  return { title: cat.title, clues };
}

/** Fill the HTML table#jeopardy with the categories & cells for questions.
 *
 * - The <thead> should be filled w/a <tr>, and a <td> for each category
 * - The <tbody> should be filled w/NUM_QUESTIONS_PER_CAT <tr>s,
 *   each with a question for each category in a <td>
 *   (initally, just show a "?" where the question/answer would go.)
 */

async function fillTable() {
  // Create table header with categories
  let $headerRow = $("<tr>");
  categories.forEach((category) => {
    $headerRow.append($("<th>").text(category.title));
  });
  $("#jeopardy thead").empty().append($headerRow);

  // Create table rows with clues
  let $tbody = $("#jeopardy tbody").empty();

  for (let clueIdx = 0; clueIdx < NUM_CLUES_PER_CAT; clueIdx++) {
    let $clueRow = $("<tr>");
    // the catIdx variable keeps track of the current index of the category array being iterated over.
    // categories array has 6 array of object , so catIdx will run 0 > 5 .
    categories.forEach((category, catIdx) => {
      $clueRow.append($("<td>").attr("id", `${catIdx}-${clueIdx}`).text("?"));
    });
    $tbody.append($clueRow);
  }
}

/** Handle clicking on a clue: show the question or answer.
 *
 * Uses .showing property on clue to determine what to show:
 * - if currently null, show question & set .showing to "question"
 * - if currently "question", show answer & set .showing to "answer"
 * - if currently "answer", ignore click
 * */

function handleClick(evt) {
  // Use evt.target.id to get id attribute of element which event occured
  let id = evt.target.id;
  // Then split it 0-0 in destruct array
  let [catId, clueId] = id.split("-");
  // Access to Categories array
  // Then use CatID as index to select index of each object element in Categories array[6 elements]
  // Then select specific clue with index
  // Then return only 1 object has {question , answer , showing}
  let clue = categories[catId].clues[clueId];

  let msg;

  if (!clue.showing) {
    msg = clue.question;
    clue.showing = "question";
  } else if (clue.showing === "question") {
    msg = clue.answer;
    clue.showing = "answer";
  } else {
    // already showing answer; ignore
    return;
  }

  // Update text of cell
  $(`#${catId}-${clueId}`).html(msg);
}

function showLoadingView() {
  // Disable the restart button
  $("#restart").prop("disabled", true);

  // Add the spinner to the page
  $("#spin-container").show();
}

/** Remove the loading spinner and update the button used to fetch data. */
function hideLoadingView() {
  $("#spin-container").hide();
  $("#restart").prop("disabled", false).text("Restart Game");
}

/** Start game:
 *
 * - get random category Ids
 * - get data for each category
 * - create HTML table
 * */

async function setupAndStart() {
  showLoadingView();
  // Return an array inclues the random of 6 catIDs
  let catIds = await getCategoryIds();

  categories = [];

  for (let catId of catIds) {
    // Assign each catID to getCategory function and then return An object have { title , array of object has clues } based on catID
    // Then push each object have { title , array of object has clues } to categories array
    // [{…}, {…}, {…}, {…}, {…}, {…}]
    categories.push(await getCategory(catId));
  }
  console.log(categories);
  fillTable();

  hideLoadingView();
}

/** On click of restart button, restart game. */

$("#restart").on("click", setupAndStart);

/** On page load, setup and start & add event handler for clicking clues */

$(async function () {
  setupAndStart();
  $("#jeopardy").on("click", "td", handleClick);
});
