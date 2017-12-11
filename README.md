# My Neighborhood

The My neighborhood App is a one page JavaScript application to search for nearby places within a designated area.  The search results are then marked on the map.  Each marker contains information about the results obtained via FourSquare's API. The application utilizes the Google Map API, its Places and Geometry Libraries, and the FourSquare API.  The application is run with a simple Python server.  


## Requirements

* Python 2.7
* Flask version >=0.9


## Installation
1. Clone the GitHub repository then cd to my_neighborhood.
  ```
  $ git clone https://github.com/nicholsont/my_neighborhood.git
  $ cd my_neighborhood
  ```
2. Install dependencies
  ```
  $ pip install -r requirements.txt
  ```


## Usage
How to run server

1. Run server.py to start the server
  ```
  $ python server.py
  ```

Application Features

* Search for place/venue within the designated area using the search box
* Filter through search items
* Click markers to view StreetView and venue information
* Click search items to open a new page to FourSquare venue page


## License
Please refer to the [License](LICENSE.md).
