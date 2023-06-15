
const fs = require("fs");
const CarRentalPlatform = artifacts.require("CarRentalPlatform");

module.exports = async function (deployer) {
  await deployer.deploy(CarRentalPlatform);
  const instance = await CarRentalPlatform.deployed();
  let carRentalPlatformAddress = await instance.address;

  let config = "export const carRentalPlatformAddress = " + carRentalPlatformAddress;

  console.log("carRentalPlatformAddress = " + carRentalPlatformAddress);

  let data = JSON.stringify(config);

  fs.writeFileSync("config.js", JSON.parse(data));
};
