export class URLService {
  readonly service_url: string;

  constructor() {
    this.service_url = process.env.REACT_APP_SERVICE_URL || 'undefined';
  }

  async CreateTinyUrl(urlInputValue: string) {
    const response = await fetch(`${this.service_url}/createTinyUrl`, {
      method: 'POST',
      mode: 'cors',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        longUrl: urlInputValue,
      }),
    });
    const responseJson = await response.json();
    return responseJson.tinyUrl;
  }
}
