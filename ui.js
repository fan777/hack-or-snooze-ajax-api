// global storyList variable
let storyList = null;

// global currentUser variable
let currentUser = null;

$(async function () {

  // section elements
  const $newArticle = $('#new-article');
  const $allStoriesList = $("#all-articles-list");
  const $favoritedArticles = $("#favorited-articles");
  const $myOwnArticles = $("#my-articles");
  const $editArticle = $('#edit-article');
  const $userSignup = $('#user-signup');
  const $userProfile = $('#user-profile');

  // form elements
  const $frmSubmit = $("#submit-form");
  const $frmEdit = $('#edit-article-form');
  const $frmLogin = $("#login-form");
  const $frmCreateAccount = $("#create-account-form");
  const $frmUpdateProfile = $("#user-profile-form");

  // navigation elements
  const $navLinks = $('#nav-links');
  const $navSubmit = $('#nav-submit');
  const $navFavorites = $('#nav-favorites');
  const $navOwnStories = $('#nav-stories');
  const $navLogin = $("#nav-login");
  const $navSignup = $('#nav-signup');
  const $navProfile = $('#nav-profile');
  const $navLogOut = $("#nav-logout");

  await checkIfLoggedIn();

  /**
   * Event handler for clicking main homepage nav link
   */
  $("body").on("click", "#nav-all", async function () {
    hideElements();
    await generateStories();
    $allStoriesList.removeClass('d-none');
  });

  /** 
   * Event handler for clicking submit nav link 
   */
  $navSubmit.on('click', function () {
    $favoritedArticles.addClass('d-none');
    $myOwnArticles.addClass('d-none');
    $userSignup.addClass('d-none');
    $userProfile.addClass('d-none');

    $allStoriesList.removeClass('d-none');
    $newArticle.toggleClass('d-none');
  });

  /** 
   * Event handler for clicking favorites nav link
   */
  $navFavorites.on('click', function () {
    hideElements();
    if (currentUser.favorites.length > 0) {
      generateStoriesForSection($favoritedArticles, currentUser.favorites);
    } else {
      $favoritedArticles.text('No favorites added!');
    }
    $favoritedArticles.removeClass('d-none');
  })

  /** 
  * Event handler for clicking my stories nav link
  */
  $navOwnStories.on('click', function () {
    hideElements();
    if (currentUser.ownStories.length > 0) {
      generateStoriesForSection($myOwnArticles, currentUser.ownStories);
      $('i.trash').removeClass('d-none');
      $('i.pencil').removeClass('d-none');
    } else {
      $myOwnArticles.text('No stories added by user yet!');
    }
    $myOwnArticles.removeClass('d-none');
  })

  /** 
   * Event handler for clicking signup nav link 
   */
  $navSignup.on("click", function () {
    hideElements();
    $userSignup.removeClass('d-none');
  });

  /**
   * Event handler for clicking user profile nav link
   */
  $navProfile.on('click', function () {
    hideElements();
    $('#profile-name').val(currentUser.name);
    $('#profile-username').val(currentUser.username);
    //$('#profile-password').val();
    $('#profile-account-date').val(currentUser.createdAt);
    $userProfile.removeClass('d-none');
  });

  /**
   * Event handler for clicking logout nav link
   */
  $navLogOut.on("click", function () {
    // empty out local storage
    localStorage.clear();
    // refresh the page, clearing memory
    location.reload();
  });

  /** 
   * Event listener for submitting new story
   */
  $frmSubmit.on('submit', async function (evt) {
    evt.preventDefault();

    // create new story
    let story = await storyList.addStory(currentUser, {
      author: $('#author').val(),
      title: $('#title').val(),
      url: $('#url').val()
    });
    currentUser.addOwnStory(story);

    // add story to DOM
    await generateStories();
    // hide submit form and reset it
    $newArticle.addClass('d-none');
    $frmSubmit.trigger('reset');
    // show stories
    $allStoriesList.removeClass('d-none');
  });

  /**
   * Event listener for submitting edit
   */
  $frmEdit.on('submit', async function (evt) {
    evt.preventDefault();
    let story = await storyList.updateStory(currentUser, $editArticle.data('storyId'), {
      author: $('#edit-author').val(),
      title: $('#edit-title').val(),
      url: $('edit-url').val()
    });
    currentUser.updateOwnStory(story);
    // add story to DOM
    await generateStories();
    // hide submit form and reset it
    $editArticle.addClass('d-none');
    $frmEdit.trigger('reset');
    // show stories
    $navOwnStories.trigger('click');
  })

  /**
   * Event listener for submitting login
   */
  $frmLogin.on("submit", async function (evt) {
    evt.preventDefault(); // no page-refresh on submit

    // grab the username and password
    const username = $("#login-username").val();
    const password = $("#login-password").val();

    try {
      // call the login static method to build a user instance
      const userInstance = await User.login(username, password);
      // set the global user to the user instance
      currentUser = userInstance;
      syncCurrentUserToLocalStorage();
      loginAndSubmitForm();
    } catch (err) {
      $('#login-alert').text(err).addClass('alert-danger').removeClass('d-none');
      window.setTimeout(() => $('#login-alert').removeClass('alert-danger').addClass('d-none'), 3000);
    }
  });

  /**
   * Event listener for submitting sign up
   */
  $frmCreateAccount.on("submit", async function (evt) {
    evt.preventDefault(); // no page refresh

    // grab the required fields
    let name = $("#create-account-name").val();
    let username = $("#create-account-username").val();
    let password = $("#create-account-password").val();

    try {
      // call the create method, which calls the API and then builds a new user instance
      const newUser = await User.create(username, password, name);
      currentUser = newUser;
      syncCurrentUserToLocalStorage();
      loginAndSubmitForm();
    } catch (err) {
      $('#signup-alert').text(err).addClass('alert-danger').removeClass('d-none');
      window.setTimeout(() => $('#signup-alert').removeClass('alert-danger').addClass('d-none'), 3000)
    }
  });

  /**
   * Event listener for updating user profile
   */
  $frmUpdateProfile.on('submit', async function (evt) {
    evt.preventDefault();

    let name = $('#profile-name').val();
    //let password = $('#profile-passowrd').val();
    try {
      const user = await currentUser.updateUser(currentUser.username, {
        token: currentUser.loginToken,
        user: {
          name
        }
      });
      $('#profile-alert').text('Profile updated completed!').addClass('alert-success').removeClass('d-none');
      window.setTimeout(() => $('#profile-alert').removeClass('alert-danger').addClass('d-none'), 3000);
    } catch (err) {
      $('#profile-alert').text(err).addClass('alert-danger').removeClass('d-none');
      window.setTimeout(() => $('#profile-alert').removeClass('alert-danger').addClass('d-none'), 3000);
    }
  });

  /** 
   * Event listener for clicking on star
   */
  $('#articles').on('click', 'i.star', async function (evt) {
    $(evt.target).toggleClass(['bi-star', 'bi-star-fill']);
    await currentUser.toggleStoryFavorite($(evt.target).parent().attr('id'));
  })

  /**
   * Event listener for clicking on trash can
   */
  $('#articles').on('click', 'i.trash', async function (evt) {
    // delete story
    let story = await storyList.deleteStory(currentUser, $(evt.target).parent().attr('id'));
    currentUser.deleteOwnStory(story);
    // update DOM
    await generateStories();
    $(evt.target).parent().remove();
  })

  /** 
   * Event listener for clicking on pencil
   */
  $('#articles').on('click', 'i.pencil', async function (evt) {
    let story = currentUser.ownStories.find(({ storyId }) => storyId === $(evt.target).parent().attr('id'));
    $('#edit-author').val(story.author);
    $('#edit-title').val(story.title);
    $('#edit-url').val(story.url);
    $editArticle.data('storyId', story.storyId);
    $editArticle.removeClass('d-none');
  })

  /**
   * A rendering function to reset the forms and hide the login info
   */
  function loginAndSubmitForm() {
    $userSignup.addClass('d-none');

    // reset those forms
    $frmLogin.trigger("reset");
    $frmCreateAccount.trigger("reset");

    // show the stories
    generateStories();
    $allStoriesList.removeClass('d-none');

    // update the navigation bar
    showNavForLoggedInUser();
  }

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
    $allStoriesList.removeClass('d-none');

    if (currentUser) {
      showNavForLoggedInUser();
    }
  }

  /**
   * A rendering function to call the StoryList.getStories static method,
   * which will generate a storyListInstance. Then render it.
   */
  async function generateStories() {
    // get an instance of StoryList
    const storyListInstance = await StoryList.getStories();
    // update our global variable
    storyList = storyListInstance;
    // generate stories
    generateStoriesForSection($allStoriesList, storyList.stories)
  }

  /** 
   * Helper function to generate stories for specific sections
   */
  function generateStoriesForSection(section, stories) {
    // empty out that part of the page
    section.empty();
    // loop through all of our stories and generate HTML for them
    for (let story of stories) {
      const result = generateStoryHTML(story);
      section.append(result);
    }
  }

  /**
   * A function to render HTML for an individual Story instance
   */
  function generateStoryHTML(story) {
    let hostName = getHostName(story.url);
    let favorite = "";
    let ownStory = "";

    // set star icon
    if (currentUser != null) {
      favorite = currentUser.favorites.find((val) => val.storyId === story.storyId) != undefined ? `<i class="star bi bi-star-fill"></i>` : `<i class="star bi bi-star"></i>`;
    }

    if (currentUser != null) {
      ownStory = currentUser.ownStories.find((val) => val.storyId === story.storyId) != undefined ? `<i class="trash bi bi-trash-fill d-none"></i> <i class="pencil bi bi-pencil-fill d-none"></i>` : "";
    }

    // render story markup
    const storyMarkup = $(`
      <li class="list-group-item" id="${story.storyId}">
        ${favorite} ${ownStory}
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
    $navLogin.addClass('d-none');
    $navLinks.removeClass('d-none');
    $navProfile.text(currentUser.username).removeClass('d-none');
    $navLogOut.removeClass('d-none');
  }

  /* hide all elements in elementsArr */
  function hideElements() {
    const elementsArr = [
      $newArticle,
      $allStoriesList,
      $favoritedArticles,
      $myOwnArticles,
      $editArticle,
      $userSignup,
      $userProfile
    ];
    elementsArr.forEach($elem => $elem.addClass('d-none'));
    $('i.trash').addClass('d-none');
    $('i.pencil').addClass('d-none');
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
