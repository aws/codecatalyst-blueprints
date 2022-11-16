import * as React from 'react';
import * as cs from '@cloudscape-design/components';
import { URLService } from './url.api';
import Spinner from '@cloudscape-design/components/spinner';

const SERVICE = new URLService();

function App() {
  let [urlInputValue, setUrlInputValue] = React.useState('');
  let [creating, setCreating] = React.useState(false);
  async function create() {
    setCreating(true);
    let apiResponse = await SERVICE.CreateTinyUrl(urlInputValue).finally(() => {
      setCreating(false);
    });
    setUrlInputValue(apiResponse);
  }

  function reset() {
    setUrlInputValue('');
  }

  function copyToClipboard() {
    navigator.clipboard.writeText(urlInputValue);
  }

  return (
    <form>
      <cs.Form header={<cs.Header variant="h1">Tiny URL </cs.Header>}>
        <cs.Textarea
          onChange={({ detail }) => setUrlInputValue(detail.value)}
          value={urlInputValue}
          placeholder="Enter the URL to short"
        ></cs.Textarea>

        <cs.SpaceBetween direction="horizontal" size="s">
          <cs.Button disabled={creating} formAction="none" variant="primary" onClick={() => create()}>
            Create
          </cs.Button>

          <cs.Popover
            dismissButton={false}
            position="top"
            size="small"
            triggerType="custom"
            content={<cs.StatusIndicator type="info">URL copied</cs.StatusIndicator>}
          >
            <cs.Button formAction="none" onClick={() => copyToClipboard()} iconName="copy">
              Copy
            </cs.Button>
          </cs.Popover>
          <cs.Button formAction="none" variant="link" onClick={() => reset()}>
            Clear
          </cs.Button>
          {creating ? <Spinner /> : <></>}
        </cs.SpaceBetween>
      </cs.Form>
    </form>
  );
}

export default App;
