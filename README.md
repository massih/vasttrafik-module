A MagicMirror module that show timetable for public transport in Västra Götaland region in Sweden utilizing the Västtrafik Api.

![alt text][logo]


## Requirements:
You need to obtain an "api-key"(Nyckel) and "secret"(Hemlighet) in order to use the Api provided by the Vasttrafik website. Check vasttrafik website and follow their instruction to obtain those keys. Below you can find the link to their developer's portal: 

[Vasttrafik portal: https://developer.vasttrafik.se/portal](https://developer.vasttrafik.se/portal)


## Configs:
* departure: ["station1", "station2",...]

    a list of station name(s) to show their timetable
    - Note: Please copy the complete name of station from vasttrafik website to prevent any missbehaviour, e.g instead of "liseberg" use "Liseberg, Göteborg"

* arrival: {"fromStation": "toStation",...}
    
    a set of key/value pairs that represents trip between two stations
    - Note: Please copy the complete name of station from vasttrafik website to prevent any missbehaviour, e.g instead of "liseberg" use "Liseberg, Göteborg"

* showAccessbility: Boolean 

    show/hide accessibility icon
* updateInterval: Int

    determine how often should the module call vasttrifk api


[logo]: https://github.com/massih/vasttrafik-module/blob/master/screenshots/screenshot.PNG "Screenshot"