# CSV Parsing
API that returns a parsed sample csv file with information about fake Danish companies.

## Usage
1. Start the Docker container: `docker-compose up -d`
2. In a user agent (browser, Postman, etc.), access `http://localhost:8080/parse/` plus the route of the csv file, relative to the container root (e.g., for the test csv file in `/test_data`, access `http://localhost:8080/parse/test_data/danish_companies.csv`).
3. Finalise the application by stopping the container: `docker-compose down`

## Tools
Express / NodeJS / JavaScript

## Author
ChatGPT 5, prompted by Arturo Mora-Rioja based on [the Python version](https://github.com/arturomorarioja/py_csv_parser_api).