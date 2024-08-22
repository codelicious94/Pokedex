const MAX_POKEMON = 151; 
let offset = 0;
const listWrapper = document.querySelector(".pokemon-list-wrapper");
const searchInput = document.querySelector("#search-pokemon");
const notFoundMessage = document.querySelector(".pokemon-not-found");
const BASE_API = "https://pokeapi.co/api/v2/pokemon";
const EVO_API = "https://pokeapi.co/api/v2/evolution-chain";

const typeColors = {
  normal: '#A8A77A',
  fire: '#CE7E07',
  water: '#6AC0D3',
  electric: '#F7D02C',
  grass: '#4A9834',
  ice: '#96D9D6',
  fighting: '#C22E28',
  poison: '#A33EA1',
  ground: '#693E11',
  flying: '#A98FF3',
  psychic: '#F95587',
  bug: '#A6B91A',
  rock: '#757675',
  ghost: '#735797',
  dragon: '#6F35FC',
  dark: '#705746',
  steel: '#B7B7CE',
  fairy: '#D685AD'
};

let allPokemons = [];
let renderedPokemons = [];
let currentPokemonIndex = 0;

async function loadAndShowPkm() {
  showLoadingSpinner();
  
  await getAllPokemonData();
  
  hideLoadingSpinner();
}

function showLoadingSpinner() {
  const spinner = document.createElement('div');
  spinner.className = 'loading-spinner';
  spinner.innerHTML = /*HTML*/ `
    <div class="spinner-border" role="status">
      <span class="sr-only">Loading...</span>
    </div>
  `;
  document.body.appendChild(spinner);
}

function hideLoadingSpinner() {
  const spinner = document.querySelector('.loading-spinner');
  if (spinner) {
    spinner.remove();
  }
}

async function getAllPokemonData() {
  try {
    const response = await fetch(`${BASE_API}?limit=${MAX_POKEMON}&offset=0`);
    const data = await response.json();
    allPokemons = await Promise.all(data.results.map(async (pokemon) => {
      const pokemonID = pokemon.url.split("/")[6];
      const { pokemonForm } = await fetchPokemonDataBeforeRedirect(pokemonID);
      return { ...pokemon, pokemonID, pokemonForm };
    }));
    renderedPokemons = allPokemons.slice(0, 20);
    displayPokemons(renderedPokemons);
  } catch (error) {
    console.error("Fehler beim Abrufen aller Pokémon", error);
  }
}

async function fetchPokemonDataBeforeRedirect(id) {
  try {
    const [pokemon, pokemonForm] = await Promise.all([
      fetch(`${BASE_API}/${id}`).then((res) => res.json()),
      fetch(`https://pokeapi.co/api/v2/pokemon-form/${id}`).then((res) => res.json()),
    ]);
    return { pokemon, pokemonForm };
  } catch (error) {
    console.error("Fehler beim Abrufen der Pokémon-Daten vor der Weiterleitung", error);
  }
}

function displayPokemons(pokemonList) {
  listWrapper.innerHTML = '';
  pokemonList.sort((a, b) => a.pokemonID - b.pokemonID).forEach(async (pokemon) => {
    const listItem = document.createElement("div");
    listItem.className = "list-item";
    const types = pokemon.pokemonForm.types.map(typeInfo => typeInfo.type.name);
    const typeColor = typeColors[types[0]]; 
    listItem.style.backgroundColor = typeColor;

    listItem.innerHTML = showPokemons(pokemon, pokemon.pokemonID, pokemon.pokemonForm);
    
    listItem.onclick = () => {
      openPokemon(pokemon.pokemonID);
      document.getElementById('pokemon-card').style.position = 'fixed';
  };

    listWrapper.appendChild(listItem);
  });
}


function showPokemons(pokemon, pokemonID, pokemonForm) {
  const types = pokemonForm.types.map(typeInfo => typeInfo.type.name).join(', ');
  return /*HTML*/ `
    <div class="number-wrap">
      <p class="caption-fonts">#${pokemonID}</p>
    </div>
    <div class="name-wrap">
      <p class="pokemon-name">${pokemon.name}</p>
    </div>
    <div class="img-wrap">
      <img src="https://raw.githubusercontent.com/pokeapi/sprites/master/sprites/pokemon/other/dream-world/${pokemonID}.svg" alt="${pokemon.name}" />
    </div>
    <div class="type-wrap">
      <p class="pokemon-type">${types}</p>
    </div>
  `;
}

function startSearch() {
  const searchTerm = searchInput.value.toLowerCase();

  if (searchTerm.length === 0) {
    notFoundMessage.style.display = "none";
    displayPokemons(renderedPokemons);
    return;
  }

  if (searchTerm.length < 3) {
    notFoundMessage.style.display = "block";
    notFoundMessage.innerHTML = /*HTML*/ `
      <div class="Pokemon-not-found">
        <p>Bitte gebe mindestens 3 Buchstaben ein!</p>
        <img src="./img/pokemon-not-found2.png" alt="Mehr Buchstaben eingeben!">
      </div>
    `;
    displayPokemons([]); 
    return;
  }

  const filteredPokemons = allPokemons.filter((pokemon) =>
    pokemon.name.toLowerCase().includes(searchTerm)
  );
  displayPokemons(filteredPokemons);

  if (filteredPokemons.length === 0) {
    notFoundMessage.style.display = "block";
    notFoundMessage.innerHTML = /*HTML*/ `
      <div class="Pokemon-not-found">
        <p>Leider wurde kein Pokemon mit diesem Namen gefunden!</p>
        <img src="./img/pokemon-not-found.png" alt="Pokemon nicht gefunden!">
      </div>
    `;
  } else {
    notFoundMessage.style.display = "none";
  }
}

async function loadMorePokemons() {
  const newPokemons = allPokemons.slice(renderedPokemons.length, renderedPokemons.length + 20);
  renderedPokemons = [...renderedPokemons, ...newPokemons];
  displayPokemons(renderedPokemons);
}

async function openPokemon(pokemonID) {
  const pokemon = allPokemons.find((p, index) => {
    if (p.pokemonID == pokemonID) {
      currentPokemonIndex = index;
      return true;
    }
    return false;
  });

  if (!pokemon) {
    console.error('Pokemon not found');
    return;
  }

  const pokemonCard = document.getElementById('pokemon-card');
  const types = pokemon.pokemonForm.types.map(typeInfo => typeInfo.type.name);
  const typeColor = typeColors[types[0]];

  pokemonCard.classList.remove('d-none');
  pokemonCard.style.backgroundColor = typeColor;
  pokemonCard.innerHTML = await openPokemonCard(pokemon, types, pokemonID);
}

async function openPokemonCard(pokemon, types, pokemonID) {
  const response = await fetch(`https://pokeapi.co/api/v2/pokemon/${pokemonID}`);
  const data = await response.json();

  const stats = data.stats.map(statInfo => {
    return {
      name: statInfo.stat.name,
      value: statInfo.base_stat,
      percent: (statInfo.base_stat / 100) * 100
    };
  });

  const abilities = data.abilities.map(abilityInfo => abilityInfo.ability.name).join(', ');

  const statsHTML = stats.map(stat => {
    return /*HTML*/ `
      <div class="stat">
        <span class="stat-name">${stat.name}</span>
        <div class="stat-bar-background">
          <div class="stat-bar-foreground" style="background-color: ${getStatColor(stat.name)}; width: ${stat.percent}%">
            <span class="stat-value">${stat.value}</span>
          </div>
        </div>
      </div>
    `;
  }).join('');

  const cardHTML = generateCardHTML(pokemon, types, pokemonID, data, abilities, statsHTML);

  document.getElementById('pokemon-card').innerHTML = cardHTML;

  showTab('main');

  return cardHTML;
}

function generateCardHTML(pokemon, types, pokemonID, data, abilities, statsHTML) {
  return /*HTML*/`
    <div class="icon-section">
      <div id="prev" onclick="prevPokemon()" class="prev-icon"><img src="./img/pfeil_links.png"></div>
      <div id="close-icon" onclick="closePokemon()" class="close-icon"><img src="./img/löschen.png"></div>
      <div id="next" onclick="nextPokemon()" class="next-icon"><img src="./img/pfeil_rechts.png"></div>
    </div>
    <div class="center-container">
      <div class="lone-display">
        <img id="img" class="pokemon-card-image" src="https://raw.githubusercontent.com/pokeapi/sprites/master/sprites/pokemon/other/dream-world/${pokemonID}.svg" alt="${pokemon.name}">
      </div>
    </div>
    <div class="pokemon-info">
      <h2>${pokemon.name}</h2>
      <p class="pokemon-info-type">${types.join(', ')}</p>
      <div class="tabs">
        <a href="#" class="tab" onclick="showTab('main')">Main</a>
        <a href="#" class="tab" onclick="showTab('stats')">Stats</a>
        <a href="#" class="tab" onclick="showTab('evo-chain', ${pokemonID})">Evo Chain</a>
      </div>
      <div id="main" class="tab-content active">
        <p><strong>Height:</strong> ${data.height / 10} m</p>
        <p><strong>Weight:</strong> ${data.weight / 10} kg</p>
        <p><strong>Base Experience:</strong> ${data.base_experience}</p>
        <p><strong>Abilities:</strong> ${abilities}</p>
      </div>
      <div id="stats" class="tab-content">
        <div class="stats">${statsHTML}</div>
      </div>
      <div id="evo-chain" class="tab-content evo-chain-container"></div>
    </div>
  `;
}

function getStatColor(statName) {
  const colors = {
    hp: '#ff5959',
    attack: '#f5ac78',
    defense: '#fae078',
    'special-attack': '#9db7f5',
    'special-defense': '#a7db8d',
    speed: '#fa92b2'
  };
  return colors[statName] || '#ccc';
}

function prevPokemon() {
  if (currentPokemonIndex > 0) {
    currentPokemonIndex--;
  } else {
    currentPokemonIndex = allPokemons.length - 1;
  }
  const prevPokemonID = allPokemons[currentPokemonIndex].pokemonID;
  openPokemon(prevPokemonID);
}

function nextPokemon() {
  if (currentPokemonIndex < allPokemons.length - 1) {
    currentPokemonIndex++;
  } else {
    currentPokemonIndex = 0;
  }
  const nextPokemonID = allPokemons[currentPokemonIndex].pokemonID;
  openPokemon(nextPokemonID);
}

function closePokemon() {
  document.getElementById('pokemon-card').classList.add('d-none');
}

function showTab(tabId, pokemonID = null) {
  const tabs = document.querySelectorAll('.tab-content');

  tabs.forEach(tab => {
    tab.style.display = 'none';
  });

  const selectedTab = document.getElementById(tabId);
  selectedTab.style.display = 'block';

  if (tabId === 'evo-chain' && pokemonID) {
    selectedTab.innerHTML = '<p>Loading Evolution Chain...</p>';
    getEvolutionChain(pokemonID).then(displayEvolutionChain);
  }
}

async function getEvolutionChain(pokemonID) {
  try {
    const speciesResponse = await fetch(`${BASE_API}-species/${pokemonID}`);
    const speciesData = await speciesResponse.json();
    const evoChainUrl = speciesData.evolution_chain.url;

    const evoResponse = await fetch(evoChainUrl);
    const evoData = await evoResponse.json();
    
    return evoData;
  } catch (error) {
    console.error("Fehler beim Abrufen der Evolutionskette", error);
  }
}

function displayEvolutionChain(evoData) {
  let evoChainHTML = '';

  function getEvolutionDetails(chain) {
    evoChainHTML += /*HTML*/ `
    <div class="evolution-step">
      <p>${chain.species.name}</p>
      <img src="https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/dream-world/${chain.species.url.split('/')[6]}.svg" alt="${chain.species.name}">
    </div>
    `;
    if (chain.evolves_to.length > 0) {
      evoChainHTML += '<div class="evolution-arrow">→</div>';
      chain.evolves_to.forEach(evolution => getEvolutionDetails(evolution));
    }
  }

  getEvolutionDetails(evoData.chain);

  const evoChainContainer = document.getElementById('evo-chain');
  evoChainContainer.style.display = 'flex';
  evoChainContainer.innerHTML = evoChainHTML;
}

getAllPokemonData();