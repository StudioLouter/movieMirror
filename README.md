# MovieMirror
![logo](/docs/assets/images/TheMovieMirror-1920logo.jpg?raw=true "Logo of The Movie Mirror project where a woman is standing in front of a projected image where her pose is mimicked in different scenes.") 

The Movie Mirror is an interactive installation that utilizes TensorFlow's PoseNet, matching the user’s camera images with historical footage from over sixty films from the collection of the EYE Filmmuseum. From black-and-white classics and animations to short experimental films.

To see the installation in action at the Netherlands Film Festival, see [this video](https://vimeo.com/297292021) (in Dutch).


## Pre-install
Before you go ahead and install this project be aware that movies that will be reflected back by the 'mirror' will have to be supplied by the user. Secondly, a dataset of poses in movies will need to be generated and inserted into a MongoDB database. Without these steps, the 'mirror' has nothing to reflect.

Also, the user needs a webcam connected to the pc for the application to analyse.

For further in depth reading of the technical side of this project, and for a explanation how you could create your own database please go to [Technisch Verslag](docs/technisch_verslag.md) (In Dutch)

## How to install

Clone this repo into a directory:
```
cd path/to/directory
git clone https://github.com/studiolouter/movieMirror
```

Change directory to the repo that was just cloned:
```
cd movieMirror
```

And install its dependencies:
```
yarn
```

Build the distribute folder from source:
```
yarn run pack
```

It will keep watching for changes in source, and rebuild the distribute files if necessary.

## Database
Install [MongoDB](https://www.mongodb.com/) if you haven't already.

If you want to import / restore a backup of the movieMirror data, run 

```
yarn database:restore
```

This will access the dump files and restore the data found in `movieMirror/database/dump/zzw/houdingen.bson`

When the installation (and restoration) is succesful, start up a server by running 
```
yarn start:database
```


## Config
Once you have set up you MongoDB database, edit ``./src/renderer/assets/settings/Settings.js`` to reflect your MongoDB settings by changing the `database.name`, `database.host` and `database.collectionName`

Furthermore, scenes of the movies need to go inside `./static/video/scenes/{movieName}`. Inside this folder the filename should be named as `{movieName}-{###}.webm`.

> `{movieName}` Being the name of the movie without spaces, `{###}` the scene count.

The movie should then be added to `./static/data/MovieDimensions.yaml` width its width in pixels set. The video file should always have a height of 1080 pixels. 


## Start

When the build is succesful, start up a second terminal and run the following command to start the application
```
yarn start:client
```


## Documentation
Please go [here](https://studiolouter.github.io/movieMirror/) for documentation regarding the source code.

## Credits
Development of this project couldn't have been possible without the kind support of EYE Filmmuseum, Stimuleringsfonds, Netherlands Film Festival and the TensorFlow team.

## License
MIT License

