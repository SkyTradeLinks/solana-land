import chai from "chai";
import chaiAsPromised from "chai-as-promised";
import { initialSetup, InitialSetupData } from "./utils/initialSetup";
import { initializeTest } from "./test_cases/initializeTest";
import { mintTokenTest } from "./test_cases/mintTokenTest";
import { mintTokenWithOneCreatorTest } from "./test_cases/mintTokenWithOneCreatorTest";
import { mintTokenUnverifiedTest } from "./test_cases/mintTokenUnverifiedTest";
import { addVerificationCreatorTest } from "./test_cases/addVerificationCreatorTest";

chai.use(chaiAsPromised);

describe("Land program tests:", () => {
  let initialSetupData: InitialSetupData;

  before(async () => {
    initialSetupData = await initialSetup();
  });

  it("should initialize", async () => {
    await initializeTest(initialSetupData);
  });

  it("Should fail to mint if we send less than the 3 required creators", async () => {
    await mintTokenWithOneCreatorTest(initialSetupData);
  });

  it("should mint token", async () => {
    await mintTokenTest(initialSetupData);
  });

  it("should mint an unverified token", async () => {
    await mintTokenUnverifiedTest(initialSetupData);
  });

  it("should mint an unverified token and then verify it", async () => {
    await addVerificationCreatorTest(initialSetupData);
  });
});
