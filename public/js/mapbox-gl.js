//locations are first loaded into DOM and then fetched
const map = document.getElementById('map');
let locations;
if(map){
  locations = JSON.parse(document.getElementById('map').dataset.locations);
}

export const displayMap=(locations)=>{
    mapboxgl.accessToken='pk.eyJ1IjoiYmlsYWxraGFuODE4OTciLCJhIjoiY2xieXYyc3ZlMDVmMzNvcXFxa3lqbmZxNiJ9.KbrVjBMF5dcSTBOdfXKciQ';
    let map = new mapboxgl.Map({
    container: 'map',
    style: 'mapbox://styles/bilalkhan81897/clbyvb693000b14rzdfggt8xo',
    scrollZoom: false
});

let bounds = new mapboxgl.LngLatBounds();

locations.forEach(loc => {
    //Create marker
    const el = document .createElement('div');
    el.className='marker';

    //Add Marker
    new mapboxgl.Marker({
        element: el,
        anchor:'bottom'
    }).setLngLat(loc.coordinates).addTo(map);

    //Add popup
    new mapboxgl.Popup({
        offset:30
    }).setLngLat(loc.coordinates).setHTML(`<p>Day ${loc.day}: ${loc.description}</p>`).addTo(map)

    //Extend map bounds to include current location
    bounds.extend(loc.coordinates);
});

map.fitBounds(bounds, {
    padding: {top: 200, bottom:100, left: 15, right: 15}
    });
};