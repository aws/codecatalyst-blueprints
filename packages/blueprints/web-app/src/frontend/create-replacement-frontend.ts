export const createReplacementFrontend = (stackName: string, lambdas: string[]) => {
  return `
// overwite the App.tsx file with additional logic to get data from the backend
// @ts-ignore
import logo from './logo.svg';
import './App.css';
import axios from 'axios';
import config from './config.json';
import { useState, useEffect } from 'react';

function App() {
  const lambdas = ${JSON.stringify(lambdas)};
  const endpoint = (config['${stackName}Backend'] || {}).apiurl;
  const state = [];
  const [result, setResult] = useState(state);

  // the place where async functions are usually called
  useEffect(() => {
    const callApi = (path: string): Promise<any> => {
      if(!endpoint) {
        return Promise.resolve({
          data: 'no endpoint configured in config.json, calling ' + path
        });
      }
      const url = endpoint + path;
      console.log('fetching from' + url);
      try {
        return axios.get(url);
      } catch (error) {
        return error;
      }
    }

    const fetchData = async () => {
      const calls = lambdas.map(path => callApi(path.toLowerCase() + 'function'));
      const output = await Promise.all(calls);
      const datas = output.map(result => result.data);
      setResult(datas);
    }

    fetchData().catch(err => {
      console.log(err);
    });
  }, []);
  return (
   <div className="App">
      <header className="App-header">
        <img src={logo} className="App-logo" alt="logo" />
        <p>
          Edit <code>src/App.tsx</code> and save to reload.
        </p>
        <p>
        {(result || []).map(item => <div>{JSON.stringify(item)}</div>)}
        </p>
        <a className="App-link"
          href="https://reactjs.org"
          target="_blank"
          rel="noopener noreferrer"
        >
          Learn React
        </a>
      </header>
    </div>
  );
}
export default App;
`;
};
