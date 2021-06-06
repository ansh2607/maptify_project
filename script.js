'use strict';

class Activity {
  date = new Date();
  id = (Date.now() + '').slice(-10); //A random number

  markerId;

  constructor(coords, distance, duration) {
    this.coords = coords; // [lat, lng]
    this.distance = distance;
    this.duration = duration;
  }

  _setDescription() {
    // prettier-ignore
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

    this.description = `${this.type[0].toUpperCase()}${this.type.slice(1)} on ${
      months[this.date.getMonth()]
    } ${this.date.getDate()}`;
  }
}

class Running extends Activity {
  type = 'running';
  emoji = '🏃‍♂️';

  constructor(coords, distance, duration, cadence) {
    super(coords, distance, duration);
    this.cadence = cadence;
    this.calcPace();
    this._setDescription();
  }

  calcPace() {
    //min/km
    this.pace = this.duration / this.distance;
    return this.pace;
  }
}

class Cycling extends Activity {
  type = 'cycling';
  emoji = '🚴‍♀️';

  constructor(coords, distance, duration, elevationGain) {
    super(coords, distance, duration);
    this.elevationGain = elevationGain;
    this.calcSpeed();
    this._setDescription();
  }

  calcSpeed() {
    this.speed = this.distance / (this.duration / 60);
    return this.speed;
  }
}

class Dining extends Activity {
  type = 'dining';
  emoji = '🍽';

  constructor(coords, item, venue, rating) {
    super(coords);
    this.item = item;
    this.venue = venue;
    this.rating = rating;
    this.calcQuality();
    this._setDescription();
  }

  calcQuality() {
    if (this.rating <= 3) this.quality = 'bad';
    else if (this.rating > 3 && this.rating <= 7) this.quality = 'moderate';
    else this.quality = 'good';
    return this.quality;
  }
}

//////////////////////////////////////////////////////////////////////////////////////////
/// MAIN APP STRUCTURE

const form = document.querySelector('.form');
const containerActivities = document.querySelector('.activities');
const inputType = document.querySelector('.form__input--type');
const inputDistance = document.querySelector('.form__input--distance');
const inputDuration = document.querySelector('.form__input--duration');
const inputCadence = document.querySelector('.form__input--cadence');
const inputElevation = document.querySelector('.form__input--elevation');
const inputItem = document.querySelector('.form__input--item');
const inputVenue = document.querySelector('.form__input--venue');
const inputRating = document.querySelector('.form__input--rating');
const btnclearAll = document.querySelector('.clear__all');

class App {
  #map;
  #mapZoomLevel = 13;
  #mapEvent;
  #activities = [];
  #coords;
  #markers = [];

  constructor() {
    this.coords;

    // getting user's position
    this._getPosition();

    // getting data from loacalStorage
    this._getLocalStorage();

    // attaching event listeners
    form.addEventListener('submit', this._newActivity.bind(this));
    inputType.addEventListener('change', this._toggleFields);
    containerActivities.addEventListener('click', this._moveToPopup.bind(this));
    btnclearAll.addEventListener('click', this._clearAll.bind(this));
  }

  _clearAll(e) {
    const deleteBtnEl = e.target.closest('.clear__all');
    if (!deleteBtnEl) return;
    containerActivities.style.display = 'none';
    while (this.#activities.length) {
      this.#activities.pop();
    }
    this._setLocalStorage();
    location.reload();
  }

  _getPosition() {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        this._loadMap.bind(this),
        function () {
          alert('Could not get your position!!');
        }
      );
    }
  }

  _loadMap(pos) {
    const { latitude } = pos.coords;
    const { longitude } = pos.coords;
    const coords = [latitude, longitude];
    const leafIcon = L.icon({
      iconUrl: 'icon.png',
      iconSize: [38, 45],
      iconAnchor: [22, 44],
    });

    this.#map = L.map('map').setView(coords, this.#mapZoomLevel);
    this.#coords = pos;

    L.tileLayer('https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png', {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(this.#map);

    L.marker(coords, { icon: leafIcon })
      .addTo(this.#map)
      .bindPopup('Your location')
      .setPopupContent('Current location')
      .openPopup();

    this.#map.on('click', this._showForm.bind(this));

    this.#activities.forEach(act => {
      this._renderActivityMarker(act);
    });
  }

  _showForm(mapE) {
    this.#mapEvent = mapE;
    form.classList.remove('hidden');
    inputDistance.focus();
    inputItem.focus();
  }

  _hideForm() {
    //empty inputs
    inputDistance.value =
      inputDuration.value =
      inputCadence.value =
      inputElevation.value =
      inputItem.value =
      inputVenue.value =
      inputRating.value =
        '';

    // hide the form
    form.classList.add('hidden');
  }

  _toggleFields() {
    // inputType.addEventListener('change', function () {
    //   inputElevation.closest('.form__row').classList.toggle('form__row--hidden');
    //   inputCadence.closest('.form__row').classList.toggle('form__row--hidden');
    // });
    if (inputType.value === 'cycling') {
      inputDistance.closest('.form__row').classList.remove('form__row--hidden');
      inputDuration.closest('.form__row').classList.remove('form__row--hidden');
      inputElevation
        .closest('.form__row')
        .classList.remove('form__row--hidden');
      inputCadence.closest('.form__row').classList.add('form__row--hidden');
      inputItem.closest('.form__row').classList.add('form__row--hidden');
      inputVenue.closest('.form__row').classList.add('form__row--hidden');
      inputRating.closest('.form__row').classList.add('form__row--hidden');
    }
    if (inputType.value === 'running') {
      inputDistance.closest('.form__row').classList.remove('form__row--hidden');
      inputDuration.closest('.form__row').classList.remove('form__row--hidden');
      inputCadence.closest('.form__row').classList.remove('form__row--hidden');
      inputElevation.closest('.form__row').classList.add('form__row--hidden');
      inputItem.closest('.form__row').classList.add('form__row--hidden');
      inputVenue.closest('.form__row').classList.add('form__row--hidden');
      inputRating.closest('.form__row').classList.add('form__row--hidden');
    }
    if (inputType.value === 'dining') {
      inputItem.closest('.form__row').classList.remove('form__row--hidden');
      inputVenue.closest('.form__row').classList.remove('form__row--hidden');
      inputRating.closest('.form__row').classList.remove('form__row--hidden');
      inputElevation.closest('.form__row').classList.add('form__row--hidden');
      inputDistance.closest('.form__row').classList.add('form__row--hidden');
      inputDuration.closest('.form__row').classList.add('form__row--hidden');
      inputCadence.closest('.form__row').classList.add('form__row--hidden');
    }
  }

  _newActivity(e) {
    e.preventDefault();

    const validInputs = (...inputs) =>
      inputs.every(inp => Number.isFinite(inp));
    const allPositives = (...inputs) => inputs.every(inp => inp > 0);

    // getting data from form
    const type = inputType.value;
    const distance = +inputDistance.value;
    const duration = +inputDuration.value;
    const { lat, lng } = this.#mapEvent.latlng;
    let activity;

    // if activity is running, create running object
    if (type === 'running') {
      const cadence = +inputCadence.value;
      if (
        !validInputs(distance, duration, cadence) ||
        !allPositives(distance, duration, cadence)
      )
        return alert('All inputs have to positive numbers!!!');

      activity = new Running([lat, lng], distance, duration, cadence);
    }

    // if activity is cycling, create cycling object
    if (type === 'cycling') {
      const elevation = +inputElevation.value;
      if (
        !validInputs(distance, duration, elevation) ||
        !allPositives(distance, duration)
      )
        return alert('Distance and Duration have to positive numbers!!!');

      activity = new Cycling([lat, lng], distance, duration, elevation);
    }

    // if activity is dining, create dining object
    if (type === 'dining') {
      const item = inputItem.value;
      const venue = inputVenue.value;
      const rating = +inputRating.value;
      if (!validInputs(rating) || !allPositives(rating))
        return alert('Not a valid rating!!!');
      if (item === '' || venue === '')
        return alert('Input fields cannot be left empty');

      activity = new Dining([lat, lng], item, venue, rating);
    }

    // Adding new object to activities array
    this.#activities.push(activity);

    // Rendering the activity marker
    this._renderActivityMarker(activity);

    // Rendering activity on list
    this._renderActivity(activity);

    // Hinding the form and clearing the input
    this._hideForm();

    //setting local storage to all workouts
    this._setLocalStorage();
  }

  _renderActivityMarker(activity) {
    const newMarker = L.marker(activity.coords)
      .addTo(this.#map)
      .bindPopup(
        L.popup({
          maxWidth: 250,
          minWidth: 100,
          autoClose: false,
          closeOnClick: false,
          className: `${activity.type}-popup`,
        })
      )
      .setPopupContent(`${activity.emoji} ${activity.description}`)
      .openPopup();

    this.#markers.push(newMarker);
    activity.markerId = newMarker._leaflet_id;
  }

  _renderActivity(activity) {
    let html;
    html = `
      <li class="activity activity--${activity.type}" data-id="${activity.id}">
      <h2 class="activity__title">${activity.description}
      <div class="activity__controls" style="grid-column: 4; text-align: right; display: inline-block; float: right">
        <!--<button data-type="edit" class="material-icons" id="edit"> create </button>-->
        <button data-type="delete" class="material-icons" id="clear"> clear </button>
      </div></h2>
    `;
    if (activity.type === 'running') {
      html += `
          <div class="activity__details">
            <span class="activity__icon">🏃‍♂️</span>
            <span class="activity__value">${activity.distance}</span>
            <span class="activity__unit">km</span>
          </div>
          <div class="activity__details">
            <span class="activity__icon">⏱</span>
            <span class="activity__value">${activity.duration}</span>
            <span class="activity__unit">min</span>
          </div>
          <div class="activity__details">
            <span class="activity__icon">⚡️</span>
            <span class="activity__value">${activity.pace.toFixed(1)}</span>
            <span class="activity__unit">min/km</span>
          </div>
          <div class="activity__details">
            <span class="activity__icon">🦶🏼</span>
            <span class="activity__value">${activity.cadence}</span>
            <span class="activity__unit">spm</span>
          </div>
        </li>`;
    }
    if (activity.type === 'cycling') {
      html += `
          <div class="activity__details">
            <span class="activity__icon">🚴‍♀️</span>
            <span class="activity__value">${activity.distance}</span>
            <span class="activity__unit">km</span>
          </div>
          <div class="activity__details">
            <span class="activity__icon">⏱</span>
            <span class="activity__value">${activity.duration}</span>
            <span class="activity__unit">min</span>
          </div>
          <div class="activity__details">
            <span class="activity__icon">⚡️</span>
            <span class="activity__value">${activity.speed.toFixed(1)}</span>
            <span class="activity__unit">km/h</span>
          </div>
          <div class="activity__details">
            <span class="activity__icon">⛰</span>
            <span class="activity__value">${activity.elevationGain}</span>
            <span class="activity__unit">m</span>
          </div>
        </li>`;
    }
    if (activity.type === 'dining') {
      html += `
          <div class="activity__details">
            <span class="activity__icon">🍽</span>
            <span class="activity__value">${activity.item}</span>
            <span class="activity__unit"></span>
          </div>
          <div class="activity__details">
            <span class="activity__icon">🏚</span>
            <span class="activity__value">${activity.venue}</span>
            <span class="activity__unit"></span>
          </div>
          <div class="activity__details">
            <span class="activity__icon">❤</span>
            <span class="activity__value">${activity.quality}</span>
            <span class="activity__unit"></span>
          </div>
          <div class="activity__details">
            <span class="activity__icon">💯</span>
            <span class="activity__value">${activity.rating}</span>
            <span class="activity__unit">/10</span>
          </div>
        </li>`;
    }

    form.insertAdjacentHTML('afterend', html);
    btnclearAll.classList.remove('hidden');
  }

  _moveToPopup(e) {
    if (!this.#map) return;

    const btnElement = e.target.closest('.activity__controls button');
    const activityEl = e.target.closest('.activity');

    if (!activityEl) return;

    const activity = this.#activities.find(
      act => act.id === activityEl.dataset.id
    );

    if (btnElement) {
      if (btnElement.dataset.type === 'delete') this._deleteActivity(activity);
    } else {
      this.#map.setView(activity.coords, this.#mapZoomLevel, {
        animate: true,
        pan: {
          duration: 1,
        },
      });
    }
  }

  _setLocalStorage() {
    localStorage.setItem('activities', JSON.stringify(this.#activities));
  }

  _getLocalStorage() {
    const data = JSON.parse(localStorage.getItem('activities'));

    if (!data) return;

    this.#activities = data;

    this.#activities.forEach(act => {
      this._renderActivity(act);
    });
  }

  reset() {
    localStorage.removeItem('activities');
    location.reload();
  }

  _deleteActivity(activity) {
    const check = confirm('Are you sure you want to delete this activity?');

    if (!check) return;

    const delEl = document.querySelector(`.activity[data-id='${activity.id}']`);
    const delObj = this.#activities.find(obj => obj.id === delEl.dataset.id);
    const delobjIndex = this.#activities.indexOf(delObj);
    const markerObj = this.#markers.find(
      obj => obj._leaflet_id === delObj.markerId
    );
    const ms =
      window.getComputedStyle(delEl).transitionDuration.slice(0, -1) * 1000;

    // Delete from Object and memory
    this.#activities.splice(delobjIndex, 1);
    this._setLocalStorage();
    location.reload();

    // Delete from Workout list
    delEl.style.opacity = 0;
    window.setTimeout(() => delEl.closest('.activity--container').remove(), ms);

    // Delete from Map
    markerObj.remove();
  }
}

const app = new App();
