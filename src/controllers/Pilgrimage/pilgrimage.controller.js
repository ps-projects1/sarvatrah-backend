const { addPilrimagePackage } = require("./addPilgrimage");
const { deletePilgrimagePackage } = require("./deletePilgimage");
const { getPilgrimagePackage } = require("./getPilgrimage");
const { updatePilgrimagePackage } = require("./updatePilgrimPackage");
const { pilgrimagePackageDetails } = require("./pilgrimPackageDetails");
const { userPilgrimagePackageList } = require("./userPilgrimPackageList");
const { generatePilgrimagePackagePdf } = require("./pilgrimPackagePdf");

module.exports = {
  getPilgrimagePackage,
  addPilrimagePackage,
  deletePilgrimagePackage,
  updatePilgrimagePackage,
  pilgrimagePackageDetails,
  userPilgrimagePackageList,
  generatePilgrimagePackagePdf
};
