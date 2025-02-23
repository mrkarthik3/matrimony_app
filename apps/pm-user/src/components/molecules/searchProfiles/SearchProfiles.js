import { Button, Form, SearchOutlined, Select, Slider } from '../../atoms';
import { UserInfoCardsList } from '..';
import { showNotification } from '@pm/pm-ui';
import { cmToFeet } from '@pm/pm-business';
import styles from './searchProfiles.module.scss';
import { useEffect, useState } from 'react';
import { Empty, Spin } from 'antd';
import _ from 'lodash';
import axios from 'axios';
import { useOktaAuth } from '@okta/okta-react';

// constants
const COUNTRY_API_URL = `https://www.universal-tutorial.com/api`;
const MININUM_HEIGHT_IN_CMS = 122;
const MAXIMUM_HEIGHT_IN_CMS = 214;
const MINIMUM_ALLOWED_AGE = 21;
const MAXIMUM_ALLOWED_AGE = 50;
const COUNTRIES_API_TOKEN = 'UZXlBoEnsLp9p54HXkWSBMYYv0-BQ06V0AyH8VVO3VgVYPUZFOklqwegWta3iC742jA';
const COUNTRIES_API_REGISTERED_EMAIL = 'testapi@trash-mail.com';

const SearchProfiles = () => {
  const [displayText, setDisplayText] = useState('Start your search...');
  const [authToken, setAuthToken] = useState(null);
  const [statesList, setStatesList] = useState([]);
  const [responseForLoader, setResponseForLoader] = useState('noloading');
  const [citiesList, setCitiesList] = useState([]);
  const [matchesData, setMatchesData] = useState([]);
  const { authState } = useOktaAuth();

  //getting current user's oktaId
  const oktaUserId = authState.accessToken.claims.uid;
  // console.log('oktaUserId: ', oktaUserId);

  useEffect(() => {
    axios
      .get(`${COUNTRY_API_URL}/getaccesstoken`, {
        headers: {
          Accept: 'application/json',
          'api-token': COUNTRIES_API_TOKEN,
          'user-email': COUNTRIES_API_REGISTERED_EMAIL,
        },
      })
      .then((res) => {
        // must fetch and use Auth Token to use Countries API
        setAuthToken(res.data.auth_token);
      })
      .catch((err) => {
        showNotification('error', 'Country API Error!', 'Please refresh the page or try again after 10 seconds.');
        // console.log(err);
      });
  }, []);

  const [minHeight, setMinHeight] = useState(MININUM_HEIGHT_IN_CMS);
  const [maxHeight, setMaxHeight] = useState(MAXIMUM_HEIGHT_IN_CMS);

  const handleHeightSliderChange = (values) => {
    setMinHeight(values[0]);
    setMaxHeight(values[1]);
  };
  const [minAge, setMinAge] = useState(MINIMUM_ALLOWED_AGE);
  const [maxAge, setMaxAge] = useState(MAXIMUM_ALLOWED_AGE);

  const handleAgeSliderChange = (values) => {
    setMinAge(values[0]);
    setMaxAge(values[1]);
  };

  const heightBoundaries = {
    [`${minHeight}`]: {
      label: `${cmToFeet(minHeight)}`,
      style: {
        color: '#5c5fee',
        fontWeight: 'bold',
      },
    },
    [`${maxHeight}`]: {
      label: `${cmToFeet(maxHeight)}`,
      style: {
        color: '#5c5fee',
        fontWeight: 'bold',
      },
    },
  };
  const ageBoundaries = {
    [`${minAge}`]: {
      label: `${minAge}`,
      style: {
        color: '#5c5fee',
        fontWeight: 'bold',
      },
    },
    [`${maxAge}`]: {
      label: `${maxAge}`,
      style: {
        color: '#5c5fee',
        fontWeight: 'bold',
      },
    },
  };

  const onFinish = (values) => {
    setResponseForLoader('loading');
    setDisplayText(<Empty description={<span>Found 0 matche(s) based on your search criteria.</span>} />);
    showNotification(
      'success',
      'Searching...',
      'Please wait while we search for profiles based on your criteria...',
      10
    );
    axios
      .post(`https://pmapi-pesto.herokuapp.com/api/v1/search/${oktaUserId}`, { ...values })
      .then((res) => {
        showNotification('success', 'Success', `Found ${res.data.number} matche(s) based on your search criteria.`);
        // console.log(res);
        setResponseForLoader('response');
        setMatchesData(res.data.data);
      })
      .catch((err) => {
        // console.log(err);
        showNotification('error', 'Error!', err.error);
      });

    // Send this values to DB and get response....
    /// Save those  matching profiles (matchesData) in an array.
    // setMatchesData(searchResults);
    // That's all. It will automatically display search results.
  };

  const onFinishFailed = (errorInfo) => {
    showNotification('error', 'Error!', 'Please re-check your search criteria and try again.');
    // console.log('Failed:', errorInfo);
  };

  const handleCountryChange = (value) => {
    axios
      .get(`${COUNTRY_API_URL}/states/${value}`, {
        headers: {
          Authorization: `Bearer ${authToken}`,
          Accept: 'application/json',
        },
      })
      .then((res) => {
        const states = res.data.map((stateObj) => stateObj.state_name);
        setStatesList(states);
        setCitiesList([]);
      })
      .catch((err) => {
        showNotification(
          'error',
          'Country API Error!',
          'Unable to fetch States... Please refresh the page or try again after 10 seconds.'
        );
        // console.log(err);
      });
  };
  const handleStateChange = (value) => {
    axios
      .get(`${COUNTRY_API_URL}/cities/${value}`, {
        headers: {
          Authorization: `Bearer ${authToken}`,
          Accept: 'application/json',
        },
      })
      .then((res) => {
        const cities = res.data.map((cityObj) => cityObj.city_name);
        // console.log(cities);
        setCitiesList(cities);
      })
      .catch((err) => {
        showNotification(
          'error',
          'Country API Error!',
          'Unable to fetch Cities... Please refresh the page or try again after 10 seconds.'
        );
        // console.log(err);
      });
  };

  return (
    <div className={styles.superContainer}>
      <Form
        name="basic"
        labelCol={{
          span: 12,
        }}
        wrapperCol={{
          span: 5,
        }}
        initialValues={{
          remember: true,
        }}
        onFinish={onFinish}
        onFinishFailed={onFinishFailed}
        autoComplete="off"
      >
        <div className={styles.container}>
          <div className={styles.searchProfiles}>
            <div className={styles.col1}>
              <Form.Item label="Age" name="ageRange">
                <Slider
                  defaultValue={[MINIMUM_ALLOWED_AGE, MAXIMUM_ALLOWED_AGE]}
                  range={{ draggableTrack: true }}
                  min={MINIMUM_ALLOWED_AGE}
                  max={MAXIMUM_ALLOWED_AGE}
                  marks={ageBoundaries}
                  onChange={handleAgeSliderChange}
                  style={{
                    width: 135,
                  }}
                />
              </Form.Item>
              <Form.Item label="Status" name="marriageStatus">
                <Select bordered className="" defaultValue="Any">
                  <Option value="Never Married">Never Married</Option>
                  <Option value="Widowed">Widowed</Option>
                  <Option value="Divorced">Divorced</Option>
                  <Option value="Awaiting Divorce">Awaiting Divorce</Option>
                </Select>
              </Form.Item>
              <Form.Item label="Religion" name="religion">
                <Select bordered className="" defaultValue="Any">
                  <Option value="Hindu">Hindu</Option>
                  <Option value="Muslim">Muslim</Option>
                  <Option value="Christian">Christian</Option>
                  <Option value="Sikh">Sikh</Option>
                  <Option value="Jain">Jain</Option>
                  <Option value="Parsi">Parsi</Option>
                  <Option value="Buddhist">Buddhist</Option>
                  <Option value="Jewish">Jewish</Option>
                  <Option value="Others">Others</Option>
                </Select>
              </Form.Item>
              <Form.Item label="Language" name="motherTongue">
                <Select bordered className="" defaultValue="Any">
                  <Option value="Hindi">Hindi</Option>
                  <Option value="Bengali">Bengali</Option>
                  <Option value="Marathi">Marathi</Option>
                  <Option value="Telugu">Telugu</Option>
                  <Option value="Tamil">Tamil</Option>
                  <Option value="Gujarati">Gujarati</Option>
                  <Option value="Urdu">Urdu</Option>
                  <Option value="Kannada">Kannada</Option>
                  <Option value="Odia">Odia</Option>
                  <Option value="Malayalam">Malayalam</Option>
                  <Option value="Assamese">Assamese</Option>
                  <Option value="Bodo">Bodo</Option>
                  <Option value="Dogri">Dogri</Option>
                  <Option value="Kashmiri">Kashmiri</Option>
                  <Option value="Konkani">Konkani</Option>
                  <Option value="Maithili">Maithili</Option>
                  <Option value="Meiti">Meiti</Option>
                  <Option value="Nepali">Nepali</Option>
                  <Option value="Punjabi">Punjabi</Option>
                  <Option value="Sanskrit">Sanskrit</Option>
                  <Option value="Santali">Santali</Option>
                  <Option value="Others">Others</Option>
                </Select>
              </Form.Item>
            </div>
            <div className={styles.col2}>
              <Form.Item label="Height" name="heightRange">
                <Slider
                  defaultValue={[MININUM_HEIGHT_IN_CMS, MAXIMUM_HEIGHT_IN_CMS]}
                  range={{ draggableTrack: true }}
                  min={MININUM_HEIGHT_IN_CMS}
                  max={MAXIMUM_HEIGHT_IN_CMS}
                  marks={heightBoundaries}
                  step={1}
                  onChange={handleHeightSliderChange}
                  style={{
                    width: 135,
                  }}
                />
              </Form.Item>
              <Form.Item label="Country" name="country">
                <Select bordered className="" defaultValue="Any" onChange={handleCountryChange}>
                  <Option value="India">India</Option>
                  <Option value="United States">USA</Option>
                  <Option value="United Kingdom">UK</Option>
                  <Option value="United Arab Emirates">UAE</Option>
                  <Option value="Malaysia">Malaysia</Option>
                  <Option value="Australia">Australia</Option>
                  <Option value="Saudi Arabia">Saudi Arabia</Option>
                  <Option value="Canada">Canada</Option>
                  <Option value="Singapore">Singapore</Option>
                  <Option value="Kuwait">Kuwait</Option>
                  <Option value="Afghanistan">Afghanistan</Option>
                  <Option value="Albania">Albania</Option>
                  <Option value="Algeria">Algeria</Option>
                  <Option value="Andorra">Andorra</Option>
                  <Option value="Angola">Angola</Option>
                  <Option value="Antigua And Barbuda">Antigua</Option>
                  <Option value="Argentina">Argentina</Option>
                  <Option value="Armenia">Armenia</Option>
                  <Option value="Austria">Austria</Option>
                  <Option value="Azerbaijan">Azerbaijan</Option>
                  <Option value="Bahamas">Bahamas</Option>
                  <Option value="Bahrain">Bahrain</Option>
                  <Option value="Bangladesh">Bangladesh</Option>
                  <Option value="Barbados">Barbados</Option>
                  <Option value="Belarus">Belarus</Option>
                  <Option value="Belgium">Belgium</Option>
                  <Option value="Belize">Belize</Option>
                  <Option value="Benin">Benin</Option>
                  <Option value="Bhutan">Bhutan</Option>
                  <Option value="Bolivia">Bolivia</Option>
                  <Option value="Botswana">Botswana</Option>
                  <Option value="Brazil">Brazil</Option>
                  <Option value="Brunei">Brunei</Option>
                  <Option value="Bulgaria">Bulgaria</Option>
                  <Option value="Burkina Faso">Burkina</Option>
                  <Option value="Burundi">Burundi</Option>
                  <Option value="Cambodia">Cambodia</Option>
                  <Option value="Cameroon">Cameroon</Option>
                  <Option value="Cape Verde">Cape Verde</Option>
                  <Option value="Chad">Chad</Option>
                  <Option value="Chile">Chile</Option>
                  <Option value="China">China</Option>
                  <Option value="Colombia">Colombia</Option>
                  <Option value="Comoros">Comoros</Option>
                  <Option value="Congo">Congo</Option>
                  <Option value="Costa Rica">Costa Rica</Option>
                  <Option value="Croatia">Croatia</Option>
                  <Option value="Cuba">Cuba</Option>
                  <Option value="Cyprus">Cyprus</Option>
                  <Option value="Denmark">Denmark</Option>
                  <Option value="Djibouti">Djibouti</Option>
                  <Option value="Dominica">Dominica</Option>
                  <Option value="East Timor">East Timor</Option>
                  <Option value="Ecuador">Ecuador</Option>
                  <Option value="Egypt">Egypt</Option>
                  <Option value="El Salvador">El Salvador</Option>
                  <Option value="Eritrea">Eritrea</Option>
                  <Option value="Estonia">Estonia</Option>
                  <Option value="Ethiopia">Ethiopia</Option>
                  <Option value="Fiji">Fiji</Option>
                  <Option value="Finland">Finland</Option>
                  <Option value="France">France</Option>
                  <Option value="Gabon">Gabon</Option>
                  <Option value="Gambia">Gambia</Option>
                  <Option value="Georgia">Georgia</Option>
                  <Option value="Germany">Germany</Option>
                  <Option value="Ghana">Ghana</Option>
                  <Option value="Greece">Greece</Option>
                  <Option value="Grenada">Grenada</Option>
                  <Option value="Guatemala">Guatemala</Option>
                  <Option value="Guinea">Guinea</Option>
                  <Option value="Guyana">Guyana</Option>
                  <Option value="Haiti">Haiti</Option>
                  <Option value="Honduras">Honduras</Option>
                  <Option value="Hungary">Hungary</Option>
                  <Option value="Iceland">Iceland</Option>
                  <Option value="Indonesia">Indonesia</Option>
                  <Option value="Iran">Iran</Option>
                  <Option value="Iraq">Iraq</Option>
                  <Option value="Ireland">Ireland</Option>
                  <Option value="Israel">Israel</Option>
                  <Option value="Italy">Italy</Option>
                  <Option value="Ivory Coast">Ivory Coast</Option>
                  <Option value="Jamaica">Jamaica</Option>
                  <Option value="Japan">Japan</Option>
                  <Option value="Jordan">Jordan</Option>
                  <Option value="Kazakhstan">Kazakhstan</Option>
                  <Option value="Kenya">Kenya</Option>
                  <Option value="Kiribati">Kiribati</Option>
                  <Option value="Korea North">Korea North</Option>
                  <Option value="Korea South">Korea South</Option>
                  <Option value="Kosovo">Kosovo</Option>
                  <Option value="Kyrgyzstan">Kyrgyzstan</Option>
                  <Option value="Laos">Laos</Option>
                  <Option value="Latvia">Latvia</Option>
                  <Option value="Lebanon">Lebanon</Option>
                  <Option value="Lesotho">Lesotho</Option>
                  <Option value="Liberia">Liberia</Option>
                  <Option value="Libya">Libya</Option>
                  <Option value="Liechtenstein">Liechtenstein</Option>
                  <Option value="Lithuania">Lithuania</Option>
                  <Option value="Luxembourg">Luxembourg</Option>
                  <Option value="Macedonia">Macedonia</Option>
                  <Option value="Madagascar">Madagascar</Option>
                  <Option value="Malawi">Malawi</Option>
                  <Option value="Maldives">Maldives</Option>
                  <Option value="Mali">Mali</Option>
                  <Option value="Malta">Malta</Option>
                  <Option value="Mauritania">Mauritania</Option>
                  <Option value="Mauritius">Mauritius</Option>
                  <Option value="Mexico">Mexico</Option>
                  <Option value="Micronesia">Micronesia</Option>
                  <Option value="Moldova">Moldova</Option>
                  <Option value="Monaco">Monaco</Option>
                  <Option value="Mongolia">Mongolia</Option>
                  <Option value="Montenegro">Montenegro</Option>
                  <Option value="Morocco">Morocco</Option>
                  <Option value="Mozambique">Mozambique</Option>
                  <Option value="Myanmar">Myanmar</Option>
                  <Option value="Namibia">Namibia</Option>
                  <Option value="Nauru">Nauru</Option>
                  <Option value="Nepal">Nepal</Option>
                  <Option value="Netherlands">Netherlands</Option>
                  <Option value="New Zealand">New Zealand</Option>
                  <Option value="Nicaragua">Nicaragua</Option>
                  <Option value="Niger">Niger</Option>
                  <Option value="Nigeria">Nigeria</Option>
                  <Option value="Norway">Norway</Option>
                  <Option value="Oman">Oman</Option>
                  <Option value="Pakistan">Pakistan</Option>
                  <Option value="Palau">Palau</Option>
                  <Option value="Panama">Panama</Option>
                  <Option value="Paraguay">Paraguay</Option>
                  <Option value="Peru">Peru</Option>
                  <Option value="Philippines">Philippines</Option>
                  <Option value="Poland">Poland</Option>
                  <Option value="Portugal">Portugal</Option>
                  <Option value="Qatar">Qatar</Option>
                  <Option value="Romania">Romania</Option>
                  <Option value="Russian">Russian</Option>
                  <Option value="Rwanda">Rwanda</Option>
                  <Option value="St Lucia">St Lucia</Option>
                  <Option value="Samoa">Samoa</Option>
                  <Option value="San Marino">San Marino</Option>
                  <Option value="Senegal">Senegal</Option>
                  <Option value="Serbia">Serbia</Option>
                  <Option value="Seychelles">Seychelles</Option>
                  <Option value="Sierra Leone">Sierra Leone</Option>
                  <Option value="Slovakia">Slovakia</Option>
                  <Option value="Slovenia">Slovenia</Option>
                  <Option value="Solomon Islands">Solomon Islands</Option>
                  <Option value="Somalia">Somalia</Option>
                  <Option value="South Africa">South Africa</Option>
                  <Option value="South Sudan">South Sudan</Option>
                  <Option value="Spain">Spain</Option>
                  <Option value="Sri Lanka">Sri Lanka</Option>
                  <Option value="Sudan">Sudan</Option>
                  <Option value="Suriname">Suriname</Option>
                  <Option value="Swaziland">Swaziland</Option>
                  <Option value="Sweden">Sweden</Option>
                  <Option value="Switzerland">Switzerland</Option>
                  <Option value="Syria">Syria</Option>
                  <Option value="Taiwan">Taiwan</Option>
                  <Option value="Tajikistan">Tajikistan</Option>
                  <Option value="Tanzania">Tanzania</Option>
                  <Option value="Thailand">Thailand</Option>
                  <Option value="Togo">Togo</Option>
                  <Option value="Tonga">Tonga</Option>
                  <Option value="Tunisia">Tunisia</Option>
                  <Option value="Turkey">Turkey</Option>
                  <Option value="Turkmenistan">Turkmenistan</Option>
                  <Option value="Tuvalu">Tuvalu</Option>
                  <Option value="Uganda">Uganda</Option>
                  <Option value="Ukraine">Ukraine</Option>
                  <Option value="Uruguay">Uruguay</Option>
                  <Option value="Uzbekistan">Uzbekistan</Option>
                  <Option value="Vanuatu">Vanuatu</Option>
                  <Option value="Vatican City">Vatican City</Option>
                  <Option value="Venezuela">Venezuela</Option>
                  <Option value="Vietnam">Vietnam</Option>
                  <Option value="Yemen">Yemen</Option>
                  <Option value="Zambia">Zambia</Option>
                  <Option value="Zimbabwe">Zimbabwe</Option>
                </Select>
              </Form.Item>
              <Form.Item label="State" name="state">
                <Select bordered className="" defaultValue="Any" onChange={handleStateChange}>
                  {statesList?.map((state) => (
                    <Option value={state} key={Math.random()}>
                      {state}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
              <Form.Item label="City" name="city">
                <Select bordered className="" defaultValue="Any" value="">
                  {citiesList?.map((city) => (
                    <Option value={city} key={Math.random()}>
                      {city}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </div>
          </div>
          <div className={styles.submitBtn}>
            <Form.Item>
              <Button type="primary" htmlType="submit" icon={<SearchOutlined />} shape="round" size="middle">
                Search
              </Button>
            </Form.Item>
          </div>
        </div>
      </Form>

      {responseForLoader === 'noloading' ? (
        <div className={styles.searchResults}>
          {matchesData.length > 0 ? <UserInfoCardsList matchesData={matchesData} /> : <h2>{displayText}</h2>}
        </div>
      ) : responseForLoader === 'loading' ? (
        <Spin />
      ) : (
        <div className={styles.searchResults}>
          {matchesData.length > 0 ? <UserInfoCardsList matchesData={matchesData} /> : <h2>{displayText}</h2>}
        </div>
      )}
    </div>
  );
};

export default SearchProfiles;
