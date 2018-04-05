A MagicMirror module that show timetable for public transport in Västra Götaland region in Sweden utilizing the Västtrafik Api.

![alt text][logo]


## Requirements:
You need to obtain an "api-key"(Nyckel) and "secret"(Hemlighet) in order to use the Api provided by the Vasttrafik website. Check vasttrafik website and follow their instruction to obtain those keys. Below you can find the link to their developer's portal: 

[Vasttrafik portal: https://developer.vasttrafik.se/portal](https://developer.vasttrafik.se/portal)


## Configs:
* departure: ["station1", "station2",...]  
    A list of station name(s) to show their timetable
    - Note: Please copy the complete name of station from vasttrafik website to prevent any missbehaviour, e.g instead of "liseberg" use "Liseberg, Göteborg"

* arrival: {"fromStation": "toStation",...}      
    A set of key/value pairs that represents trip between two stations.
    - Note: Please copy the complete name of station from vasttrafik website to prevent any missbehaviour, e.g instead of "liseberg" use "Liseberg, Göteborg"

* updateInterval: Int  
    determine how often should the module calls vasttrifk api, in milliseconds. Default is 120,000.

* showAccessbility: Boolean  
    show/hide accessibility icon.

* useVas: Boolean  
    To exclude to exclude trips with Västtågen, set this parameter to false.

* useLDTrain: Boolean  
    To exclude trips with long distance trains, set this parameter to false.

* useRegTrain: Boolean  
    To exclude trips with regional trains, set this parameter to false.

* useBus: Boolean  
    To exclude trips with buses, set this parameter to false.

* useBoat: Boolean  
    To exclude trips with boats, set this parameter to false.

* useTram: Boolean  
    To exclude trips with trams, set this parameter to false.

* excludeDR: Boolean  
    To exclude journeys which require tel. registration, set this parameter to false.



[logo]: https://github.com/massih/vasttrafik-module/blob/master/screenshots/screenshot.PNG "Screenshot"