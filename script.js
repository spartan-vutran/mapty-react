'use strict';

// let map, mapEvent;

/////////////////////////////
// Plugin function

/////////////////////////////
// Workout Class
class Workout {
  date = new Date();
  id = `${new Date().getTime()}${Math.floor(Math.random() * 100) + 1}`;
  constructor(coords, distance, duration) {
    this.coords = coords; //[lat,lng]
    this.distance = distance; // in km
    this.duration = duration; // in min
  }

  _setDescription() {
    // prettier-ignore
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

    const stringDate = new Intl.DateTimeFormat(navigator.language, {
      month: 'long',
      day: '2-digit',
    }).format(this.date);

    this.description = `${this.type[0].toUpperCase()}${this.type.slice(
      1
    )} on ${stringDate}`;
  }
}

class Running extends Workout {
  type = 'running';
  constructor(coords, distance, duration, cardence) {
    super(coords, distance, duration);
    this.cardence = cardence;
    this.calcPace();
    this._setDescription();
  }

  calcPace() {
    this.pace = (this.duration / this.distance).toPrecision(2);
    return this.pace;
  }
}
class Cycling extends Workout {
  type = 'cycling';
  constructor(coords, distance, duration, elevationGain) {
    super(coords, distance, duration);

    this.elelevationGain = elevationGain;
    this.calcSpeed();
    this._setDescription();
  }

  calcSpeed() {
    // km/h
    this.speed = (this.distance / (this.duration / 60)).toPrecision(2);
  }
}

// const run1 = new Running([39, -12], 5.2, 24, 178);
// const cycling1 = new Cycling([39, -12], 27, 95, 523);
// console.log(run1, cycling1);

/////////////////////////////
// App Class

const form = document.querySelector('.form');
const containerWorkouts = document.querySelector('.workouts');
const inputType = document.querySelector('.form__input--type');
const inputDistance = document.querySelector('.form__input--distance');
const inputDuration = document.querySelector('.form__input--duration');
const inputCadence = document.querySelector('.form__input--cadence');
const inputElevation = document.querySelector('.form__input--elevation');

class App {
  #workouts = [];
  #map;
  #mapEvent;
  #mapZoomLevel = 13;

  constructor() {
    // Get user's position
    this._getPosition();

    // Get data from local storage
    this._getLocalStorage();

    // Attach event handlers
    inputType.addEventListener('change', this._toggleElevationField);
    form.addEventListener('submit', this._newWorkout.bind(this));
    containerWorkouts.addEventListener('click', this._moveToPopUp.bind(this));
  }

  _getPosition() {
    if (navigator.geolocation)
      navigator.geolocation.getCurrentPosition(
        this._loadMap.bind(this),
        function () {
          alert('Could not get your position');
        }
      );
  }

  _loadMap(position) {
    const { latitude, longitude } = position.coords;
    // console.log(latitude, longitude);
    // console.log(`https://www.google.com/maps/@${latitude},${longitude}`);

    this.#map = L.map('map').setView([latitude, longitude], this.#mapZoomLevel);
    // console.log(this);
    L.tileLayer('https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png', {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(this.#map);

    //Handling clicks on map
    this.#map.on('click', this._showForm.bind(this));

    this.#workouts.forEach(el => {
      this._renderWorkoutMarker(el);
    });
  }

  _showForm(mapE) {
    this.#mapEvent = mapE;
    form.classList.remove('hidden');
    inputDistance.focus();
  }

  _toggleElevationField() {
    inputElevation.closest('.form__row').classList.toggle('form__row--hidden');
    inputCadence.closest('.form__row').classList.toggle('form__row--hidden');
  }

  _newWorkout(e) {
    e.preventDefault();
    // console.log(this.#mapEvent);
    const isValid = (...inputs) => inputs.every(ip => isFinite(ip) && ip > 0);

    // Get data from form
    const type = inputType.value;
    const distance = Number(inputDistance.value);
    const duration = Number(inputDuration.value);

    const caOrEle =
      type === 'running'
        ? Number(inputCadence.value)
        : Number(inputElevation.value);
    // Check if data is valid

    if (
      (!isValid(distance, duration, caOrEle) && type === 'running') ||
      (!isValid(distance, duration) && type === 'cycling')
    )
      return alert('Inputs have to be positive numbers!');

    const coords = Object.values(this.#mapEvent.latlng);

    // If activity running, create running object
    // If activity cycling, create cycling object
    const runOrCyc_workOut =
      type === 'running'
        ? new Running(coords, distance, duration, caOrEle)
        : new Cycling(coords, distance, duration, caOrEle);

    // Add the new to workouts
    this.#workouts.push(runOrCyc_workOut);

    // Render workout on map as marker
    this._renderWorkoutMarker(runOrCyc_workOut);

    // Render workout on list
    this._renderWorkout(runOrCyc_workOut);

    // Hide form + clear input fields
    this._hideForm();

    //Set local storage to all workouts
    this._setLocalStorage();
  }

  _renderWorkoutMarker(workout) {
    L.marker(workout.coords)
      .addTo(this.#map)
      .bindPopup(
        L.popup({
          maxWidth: 250,
          minWidth: 250,
          autoClose: false,
          closeOnClick: false,
          className: `${workout.type}-popup
          }`,
        })
      )
      .setPopupContent(
        `${workout.type === 'running' ? '🏃‍♂️' : '🚴‍♀️'} ${workout.description}`
      )
      .openPopup();
  }

  _renderWorkout(workout) {
    const html = ` <li class="workout workout--${workout.type}" data-id=${
      workout.id
    }>
          <h2 class="workout__title">${workout.description}</h2>
          <div class="workout__details">
            <span class="workout__icon">${
              workout.type === 'running' ? '🏃‍♂️' : '🚴‍♀️'
            } </span>
            <span class="workout__value">${workout.distance}</span>
            <span class="workout__unit">km</span>
          </div>
          <div class="workout__details">
            <span class="workout__icon">⏱</span>
            <span class="workout__value">${workout.duration}</span>
            <span class="workout__unit">min</span>
          </div>
          <div class="workout__details">
            <span class="workout__icon">⚡️</span>
            <span class="workout__value">${workout.pace}</span>
            <span class="workout__unit">min/km</span>
          </div>
          <div class="workout__details">
            <span class="workout__icon">${
              workout.type === 'running' ? '🦶🏼' : '⛰'
            }</span>
            <span class="workout__value">${
              workout.type === 'running'
                ? workout.cardence
                : workout.elelevationGain
            }</span>
            <span class="workout__unit">spm</span>
          </div>
        </li>`;
    containerWorkouts.insertAdjacentHTML('beforeend', html);
  }

  _hideForm() {
    inputDistance.value =
      inputElevation.value =
      inputDuration.value =
      inputCadence.value =
        '';
    inputType.value = 'running';
    form.style.display = 'none';
    form.classList.add('hidden');
    // console.log('adsa');
    setTimeout(() => (form.style.display = 'grid'), 1000);
  }

  _moveToPopUp(e) {
    // console.log(e.target.closest('.workout'));
    const workOutElement = e.target.closest('.workout');
    if (workOutElement) {
      const workout = this.#workouts.find(
        el => el.id === workOutElement.dataset.id
      );

      this.#map = this.#map.setView(workout.coords, this.#mapZoomLevel, {
        animate: true,
        pan: {
          duration: 1,
        },
      });
    }
  }

  _setLocalStorage() {
    localStorage.setItem('workouts', JSON.stringify(this.#workouts));
  }
  _getLocalStorage() {
    const data = JSON.parse(localStorage.getItem('workouts'));

    if (!data) return;

    this.#workouts = data;

    this.#workouts.map(el => {
      this._renderWorkout(el);
      el.__proto__ =
        el.type === 'running' ? Running.prototype : Cycling.prototype;
      return el;
    });
  }

  reset() {
    localStorage.removeItem('workouts');
    location.reload();
  }
}

const app = new App();

// Change selected option
