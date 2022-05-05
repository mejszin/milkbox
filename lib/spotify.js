const fs = require('fs');
var SpotifyWebApi = require('spotify-web-api-node');

var spotifyClientId = fs.readFileSync('data/spotify_client_id').toString();
var spotifyClientSecret = fs.readFileSync('data/spotify_client_secret').toString();

var spotifyApi = new SpotifyWebApi({
  clientId: spotifyClientId,
  clientSecret: spotifyClientSecret,
});

spotifyApi.clientCredentialsGrant().then(
    async function(data) {
        console.log('The access token expires in ' + data.body['expires_in']);
        console.log('The access token is ' + data.body['access_token']);
        // Save the access token so that it's used in future calls
        spotifyApi.setAccessToken(data.body['access_token']);
        displayTracksPage();
    },
    function(err) {
        console.log('Something went wrong when retrieving an access token', err);
    }
);

var artist_genres = {};

async function getArtistGenres(artist_name) {
    if (artist_name in artist_genres) {
        return artist_genres[artist_name];
    }
    var data = await spotifyApi.searchArtists(artist_name);
    var genres = (data.body.artists.items.length > 0) ? data.body.artists.items[0].genres : [];
    artist_genres[artist_name] = genres;
    return genres
}