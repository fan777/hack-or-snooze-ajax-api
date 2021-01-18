// global storyList variable
let storyList = null;

// global currentUser variable
let currentUser = null;

$(async function () {
  // cache some selectors we'll be using quite a bit
  const $allStoriesList = $("#all-articles-list");
  const $submitForm = $("#submit-form");
  const $favoritedArticles = $("#favorited-articles");
  const $filteredArticles = $("#filtered-articles");
  const $loginForm = $("#login-form");
  const $createAccountForm = $("#create-account-form");
  const $ownStories = $("#my-articles");
  const $userProfile = $('#user-profile');
  const $navLinks = $('#main-nav-links');
  const $navLogin = $("#nav-login");
  const $navLogOut = $("#nav-logout");
  const $navProfile = $('#nav-user-profile');

  await checkIfLoggedIn();

  /**
   * Event listener for logging in.
   *  If successfully we will setup the user instance
   */
  $loginForm.on("submit", async function (evt) {
    evt.preventDefault(); // no page-refresh on submit

    // grab the username and password
    const username = $("#login-username").val();
    const password = $("#login-password").val();

    // call the login static method to build a user instance
    const userInstance = await User.login(username, password);
    // set the global user to the user instance
    currentUser = userInstance;
    syncCurrentUserToLocalStorage();
    loginAndSubmitForm();
  });

  /**
   * Event listener for signing up.
   *  If successfully we will setup a new user instance
   */
  $createAccountForm.on("submit", async function (evt) {
    evt.preventDefault(); // no page refresh

    // grab the required fields
    let name = $("#create-account-name").val();
    let username = $("#create-account-username").val();
    let password = $("#create-account-password").val();

    // call the create method, which calls the API and then builds a new user instance
    const newUser = await User.create(username, password, name);
    currentUser = newUser;
    syncCurrentUserToLocalStorage();
    loginAndSubmitForm();
  });

  /**
   * Event listener for submitting new story
   */
  $submitForm.on('submit', async function (evt) {
    evt.preventDefault();

    // create new story
    await storyList.addStory(currentUser, {
      author: $('#author').val(),
      title: $('#title').val(),
      url: $('#url').val()
    });

    // add story to DOM
    await generateStories();
    // hide submit form and reset it
    $submitForm.slideToggle();
    $submitForm.trigger('reset');
  })

  /**
  * Log Out Functionality
  */
  $navLogOut.on("click", function () {
    // empty out local storage
    localStorage.clear();
    // refresh the page, clearing memory
    location.reload();
  });

  /**
   * Event handler for Clicking Login
   */
  $navLogin.on("click", function () {
    // Show the Login and Create Account Forms
    $loginForm.slideToggle();
    $createAccountForm.slideToggle();
    $allStoriesList.toggle();
  });

  /**
   * Event handler for Clicking User Profile
   */
  $navProfile.on('click', function () {
    hideElements();
    $('#profile-name').text(currentUser.name);
    $('#profile-username').text(currentUser.username);
    $('#profile-account-date').text(currentUser.createdAt);
    $userProfile.show();
  });

  /**
   * Event handler for Navigation to Homepage
   */
  $("body").on("click", "#nav-all", async function () {
    hideElements();
    await generateStories();
    $allStoriesList.show();
  });

  /**
   * Event handler for toggling Submit Form
   */
  $('#nav-submit').on('click', function () {
    hideElements();
    $submitForm.slideToggle();
    $allStoriesList.show();
  });


  /**
   * Event handler for showing My Favorite stories
   */
  $('#nav-favorites').on('click', function () {
    hideElements();
    generateFavorites();
    $favoritedArticles.show();
  });

  /**
   * Event handler for showing My Own stories
   */
  $('#nav-stories').on('click', function () {
    hideElements();
    generateOwnStories();
    $ownStories.show();
  });

  /**
   * Event listener for starring a favorite
   */
  $('.articles-container').on('click', 'i.star', async function (evt) {
    $(evt.target).toggleClass(['far', 'fas']);
    await currentUser.toggleStoryFavorite($(evt.target).parent().attr('id'));
    generateFavorites();
  });

  /**
   * Event listener for deleting own story
   */
  $('.articles-container').on('click', 'i.trash-can', async function (evt) {
    await currentUser.deleteOwnStory($(evt.target).parent().attr('id'));
    //$(evt.target).parent().remove();
    generateOwnStories();
  });

  /**
   * On page load, checks local storage to see if the user is already logged in.
   * Renders page information accordingly.
   */
  async function checkIfLoggedIn() {
    // let's see if we're logged in
    const token = localStorage.getItem("token");
    const username = localStorage.getItem("username");

    // if there is a token in localStorage, call User.getLoggedInUser
    //  to get an instance of User with the right details
    //  this is designed to run once, on page load
    currentUser = await User.getLoggedInUser(token, username);
    await generateStories();

    if (currentUser) {
      showNavForLoggedInUser();
    }
  }

  /**
   * A rendering function to run to reset the forms and hide the login info
   */
  function loginAndSubmitForm() {
    // hide the forms for logging in and signing up
    $loginForm.hide();
    $createAccountForm.hide();

    // reset those forms
    $loginForm.trigger("reset");
    $createAccountForm.trigger("reset");

    // show the stories
    generateStories();
    $allStoriesList.show();

    // update the navigation bar
    showNavForLoggedInUser();
  }

  /**
   * A rendering function to call the StoryList.getStories static method,
   *  which will generate a storyListInstance. Then render it.
   */
  async function generateStories() {
    // get an instance of StoryList
    const storyListInstance = await StoryList.getStories();
    // update our global variable
    storyList = storyListInstance;
    // empty out that part of the page
    $allStoriesList.empty();

    // loop through all of our stories and generate HTML for them
    for (let story of storyList.stories) {
      const result = generateStoryHTML(story);
      $allStoriesList.append(result);
    }
  }

  /**
   * A rendering function to show Favorite stories
   */
  function generateFavorites() {
    // empty favorites
    $favoritedArticles.empty();

    if (currentUser.favorites.length > 0) {
      for (let story of currentUser.favorites) {
        const result = generateStoryHTML(story);
        $favoritedArticles.append(result);
      }
    } else {
      $favoritedArticles.addClass('articles-list').text('No favorites added!');
    }
  }

  /**
   * A rendering function to show Favorite stories
   */
  function generateOwnStories() {
    // empty favorites
    $ownStories.empty();

    if (currentUser.ownStories.length > 0) {
      let trash = `<i class="trash-can fas fa-trash-alt"></i>`;
      for (let story of currentUser.ownStories) {
        const result = generateStoryHTML(story);
        $ownStories.append(result);
      }
      $('i').before(trash);
    } else {
      $ownStories.addClass('articles-list').text('No stories added by user yet!');
    }
  }

  /**
   * A function to render HTML for an individual Story instance
   */
  function generateStoryHTML(story) {
    let hostName = getHostName(story.url);
    let star = "";

    // set star icon
    if (currentUser != null) {
      star = currentUser.favorites.find((val) => val.storyId === story.storyId) != undefined ?
        `<i class="star fas fa-star"></i>` : `<i class="star far fa-star"></i>`;
    }
    // render story markup
    const storyMarkup = $(`
      <li id="${story.storyId}">
        ${star}
        <a class="article-link" href="${story.url}" target="a_blank">
          <strong>${story.title}</strong>
        </a>
        <small class="article-hostname ${hostName}">(${hostName})</small>
        <small class="article-author">by ${story.author}</small>
        <small class="article-username">posted by ${story.username}</small>
      </li>
    `);

    return storyMarkup;
  }

  function showNavForLoggedInUser() {
    $navLogin.hide();
    $navLogOut.show();
    $navLinks.show();
    $navProfile.text(currentUser.username).show();
  }

  /* hide all elements in elementsArr */
  function hideElements() {
    const elementsArr = [
      $submitForm,
      $allStoriesList,
      $favoritedArticles,
      $filteredArticles,
      $ownStories,
      $loginForm,
      $createAccountForm,
      $userProfile
    ];
    elementsArr.forEach($elem => $elem.hide());
  }

  /* simple function to pull the hostname from a URL */
  function getHostName(url) {
    let hostName;
    if (url.indexOf("://") > -1) {
      hostName = url.split("/")[2];
    } else {
      hostName = url.split("/")[0];
    }
    if (hostName.slice(0, 4) === "www.") {
      hostName = hostName.slice(4);
    }
    return hostName;
  }

  /* sync current user information to localStorage */
  function syncCurrentUserToLocalStorage() {
    if (currentUser) {
      localStorage.setItem("token", currentUser.loginToken);
      localStorage.setItem("username", currentUser.username);
    }
  }
});
