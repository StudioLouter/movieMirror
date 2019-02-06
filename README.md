# MovieMirror
![logo](/docs/assets/images/TheMovieMirror-1920logo.jpg?raw=true "Logo Title Text 2") 

The Movie Mirror is an interactive installation that utilizes TensorFlow's PoseNet, matching the user’s camera images with historical footage from over sixty films from the collection of the EYE Filmmuseum. From black-and-white classics and animations to short experimental films.

To see the installation in action at the Netherlands Film Festival, see [this video](https://vimeo.com/297292021).


## Pre-install
Before you go ahead and install this project. Be aware that movies that will be reflected back by the 'mirror' will have to be supplied by the user. Secondly, a dataset of poses in the scenes of the movies will need to be generated and inserted into a MongoDB database. Without these steps, the 'mirror' has nothing to reflect.

Also, the user needs a webcam connected to the pc for the application to analyse.

For further in depth reading of the technical side of this project, and for a explainaiting how you could create your own database please go to [Technisch Verslag](docs/technisch_verslag.md) (In Dutch)

## How to install

Clone this repo into a desired directory
```cmd
cd desired/location/of/project
git clone https://github.com/studiolouter/movieMirror
```

Change directory to the repo that was just cloned
```cmd
cd movieMirror
```

And install its dependencies
```cmd
yarn
```

Build the distribute folder from source by running
```cmd
yarn run pack
```

It will keep watching for changes in source, and rebuild the distribute files if necessary.

When the build is succesful, start up a second terminal and run the following command to start the application
```cmd
yarn start
```

## Documentation
Please go [here](https://studiolouter.github.io/movieMirror/) for documentation regarding the source code.

## Credits
Development of this project couldn't have been possible without the kind support of EYE Filmmuseum, Stimuleringsfonds, Netherlands Film Festival and the TensorFlow team.

## License
MIT License

