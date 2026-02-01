import { useEffect, useState } from "react";
import { Dropdown, DropdownTrigger, DropdownMenu, DropdownItem, Button } from "@heroui/react";

interface Country {
  name: string;
  flag: string;
}

interface CountryDropdownProps {
  setCountry: (country: string) => void;
}

const CountryDropdown: React.FC<CountryDropdownProps> = ({ setCountry }) => {
  const [countries, setCountries] = useState<Country[]>([]);
  const [selectedCountry, setSelectedCountry] = useState<Country | null>(null);

  useEffect(() => {
    fetch("https://restcountries.com/v3.1/all")
      .then((res) => res.json())
      .then((data) => {
        const countryList = data.map((country: any) => ({
          name: country.name.common,
          flag: country.flags.svg,
        }));
        const sortedCountryList = countryList.sort((a: any, b: any) => a.name.localeCompare(b.name));
        setCountries(sortedCountryList);
      })
      .catch((error) => console.error("Error fetching countries:", error));
  }, []);

  const handleSelect = (country: Country) => {
    setSelectedCountry(country);
    setCountry(country.name); 
  };

  return (
    <div className="flex flex-col gap-1 w-[390px]">
      <label className="text-sm text-gray-500 mb-1">COUNTRY</label>
      
      <Dropdown>
        <DropdownTrigger>
          <div className="w-full h-12 px-3 py-2 border-2 border-gray-300 dark:border-zinc-700 bg-transparent text-gray-700 dark:text-white cursor-pointer rounded-lg flex items-center justify-start">
            {selectedCountry ? (
              <>
                <p className="text-gray-700 dark:text-white text-lg">{selectedCountry.name}</p>
                <img className="ml-2 w-6 h-6" src={selectedCountry.flag} alt="flag" />
              </>
            ) : (
              <p className="text-gray-500 dark:text-white text-lg">Select a country</p>
            )}
          </div>
        </DropdownTrigger>

        <DropdownMenu aria-label="Select a Country" className="max-h-[200px] overflow-y-auto">
          {countries.map((country) => (
            <DropdownItem key={country.name} onClick={() => handleSelect(country)}>
              {country.name}
            </DropdownItem>
          ))}
        </DropdownMenu>
      </Dropdown>
    </div>
  );
};

export { CountryDropdown };  export type { Country };

