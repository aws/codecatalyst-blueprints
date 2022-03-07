export const createReplacementFrontend = (repositoryName: string) => {
  return `
// overwite the App.tsx file with additional logic to get data from the backend
// @ts-ignore
import logo from './logo.svg';
import './App.css';
import axios from 'axios';
import config from './config.json';
import { useState, useEffect } from 'react';

function App() {
  const [result, setResult] = useState({ data: null });
  useEffect(() => {
    const getData = async (): Promise<void> => {
      try {
          const result = await axios.get(config['${repositoryName}ApiStack'].apiurl ?? '');
          setResult({ data: result.data });
      } catch (e) {
          // consume exceptions
          console.log(e)
      }
    };
    getData();
  }, []);
  return (
   <div className="App">
      <header className="App-header">
        <img src={logo} className="App-logo" alt="logo" />
        <p>
          Edit <code>src/App.tsx</code> and save to reload.
        </p>
        <p>
          {result.data}
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
