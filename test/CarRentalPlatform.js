const CarRentalPlatform = artifacts.require("CarRentalPlatform");

contract("CarRentalPlatform", accounts => {

  let carRentalPlatform;
  const owner = accounts[0];
  const user1 = accounts[1];

  beforeEach(async () => {
    carRentalPlatform = await CarRentalPlatform.new();
  });

  descripe("Add user and car", () => {
    it("adds a new user", async () => {
      // Set value
      await carRentalPlatform.addUser("Alice", "Smith", {from: user1});
      // Get stored value
      const user = await carRentalPlatform.getUser(user1);

      assert.equal(user.name, "Alice", "Problem with user name");
      assert.equal(user.lastname, "Smith", "Problem with user lastname");
    });
    it("adds a car", async () => {
      // Set value
      await carRentalPlatform.addCar("Tesla model S", "example url", 10, 50000, {from: owner});
      // Get stored value
      const car = await carRentalPlatform.getCar(1);

      assert.equal(car.name, "Tesla model S", "Problem with car name");
      assert.equal(car.url, "example url", "Problem with example url");
      assert.equal(car.rentFee, 10, "Problem with rent fee");
      assert.equal(car.saleFee, 50000, "Problem with sale fee");
    });
  })

  descripe("Check out and check in car", () => {
    it("check out a car", async () => {
      // Set value
      await carRentalPlatform.addUser("Alice", "Smith", {from: user1});
      await carRentalPlatform.addCar("Tesla model S", "example url", 10, 50000, {from: owner});
      await carRentalPlatform.checkOut(1, {from: user1})

      // Get stored value
      const user = await carRentalPlatform.getUser(user1);

      assert.equal(user.rentedCarId, 1, "User could not check out the car");
    });
    it("check in a car", async () => {
      // Set value
      await carRentalPlatform.addUser("Alice", "Smith", {from: user1});
      await carRentalPlatform.addCar("Tesla model S", "example url", 10, 50000, {from: owner});
      await carRentalPlatform.checkOut(1, {from: user1})
      await new Promise((resolve) => setTimeout(resolve, 60000)); // 1 min
      await carRentalPlatform.checkIn({from: user1});

      // Get stored value
      const user = await carRentalPlatform.getUser(user1);

      assert.equal(user.rentedCarId, 0, "User could not check in the car");
      assert.equal(user.debt, 10, "User debt did not created")
    });
  })

  descripe("Deposit token and payment", () => {
    it("deposit tokens", async () => {
      // Set value
      await carRentalPlatform.addUser("Alice", "Smith", {from: user1});
      await carRentalPlatform.deposit( {from: user1, value: 100});

      // Get stored value
      const user = await carRentalPlatform.getUser(user1);

      assert.equal(user.balance, 100, "User could not deposit tokens");
    });
    it("makes a payment", async () => {
      // Set value
      await carRentalPlatform.addUser("Alice", "Smith", {from: user1});
      await carRentalPlatform.addCar("Tesla model S", "example url", 10, 50000, {from: owner});
      await carRentalPlatform.checkOut(1, {from: user1})
      await new Promise((resolve) => setTimeout(resolve, 60000)); // 1 min
      await carRentalPlatform.checkIn({from: user1});

      await carRentalPlatform.deposit( {from: user1, value: 100});
      await carRentalPlatform.makePayment({from: user1});

      // Get stored value
      const user = await carRentalPlatform.getUser(user1);

      assert.equal(user.debt, 0, "Something went wrong while trying to make the payment")
    });
  })

  descripe("edit car", () => {
    it("should edit an existing car's metadata with valid parameters", async () => {
      // Set value
      await carRentalPlatform.addCar("Tesla model S", "example url", 10, 50000, {from: owner});

      const newName = "Honda";
      const newImageUrl = "new img url";
      const newRentFee = 20;
      const newSaleFee = 100000;
      await carRentalPlatform.editCarMetadata(1, newName, newImageUrl, newRentFee, newSaleFee, {from: owner});

      // Get stored value
      const car = await carRentalPlatform.getCar(1);

      assert.equal(car.name, newName, "Problem with editing car name");
      assert.equal(car.imageUrl, newImageUrl, "Problem with updating the image url");
      assert.equal(car.rentFee, newRentFee, "Problem with editing rent fee");
      assert.equal(car.saleFee, newSaleFee, "Problem with editing sale fee");
    });
    it("should edit an existing car's status", async () => {
      // Set value
      await carRentalPlatform.addCar("Tesla model S", "example url", 10, 50000, {from: owner});
      const newStatus = 0;  // enum status: 0-Retired
      await carRentalPlatform.editCarStatus(1, newStatus, {from: user1})

      // Get stored value
      const car = await carRentalPlatform.getCar(1);

      assert.equal(car.status, newStatus, "Problem with editing car status")
    });
  })

  descripe("withdraw balance", () => {
    it("should send the desired amount of tokens to the user", async () => {
      // Set value
      await carRentalPlatform.addUser("Alice", "Smith", {from: user1});
      await carRentalPlatform.deposit( {from: user1, value: 100});
      await carRentalPlatform.withdrawBalance(50, {from: user1});

      // Get stored value
      const user = await carRentalPlatform.getUser(user1);

      assert.equal(user.balance, 50, "User could not get his/her tokens");
    });
    it("should send the desired amount of tokens to the owner", async () => {
      // Set value
      await carRentalPlatform.addUser("Alice", "Smith", {from: user1});
      await carRentalPlatform.addCar("Tesla model S", "example url", 20, 50000, {from: owner});
      
      await carRentalPlatform.checkOut(1, {from: user1})
      await new Promise((resolve) => setTimeout(resolve, 60000)); // 1 min
      await carRentalPlatform.checkIn({from: user1});

      await carRentalPlatform.deposit( {from: user1, value: 1000});
      await carRentalPlatform.makePayment({from: user1});

      // Get stored value
      const totalPaymentAmount = await carRentalPlatform.getTotalPayments({from: owner});
      const amountToWithdraw = await totalPaymentAmount - 10;
      await carRentalPlatform.withdrawOwnerBalance(amountToWithdraw, {from: owner});
      const totalPayment = await carRentalPlatform.getTotalPayments({from: owner});

      assert.equal(totalPayment, 10, "Owner could not withdraw tokens")
    });
  })
});
