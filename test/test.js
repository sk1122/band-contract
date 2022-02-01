const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Greeter", function () {
  var band, songMint, bandFactory, addr1, addr2, addr3, addr4

  beforeEach(async () => {
    [addr1, addr2, addr3, addr4] = await ethers.getSigners()
  })

  beforeEach(async () => {
    const SongNFT = await ethers.getContractFactory("SongNFT");
    songMint = await SongNFT.deploy();
    await songMint.deployed();
  })

  beforeEach(async () => {
    const Band = await ethers.getContractFactory("Band");
    band = await Band.deploy("Indian Ocean", songMint.address);
    await band.deployed();
  })

  beforeEach(async () => {
    const BandFactory = await ethers.getContractFactory("BandFactory");
    bandFactory = await BandFactory.deploy();
    await bandFactory.deployed();
  })

  describe("Band", async () => {
    
    it("Add a Song", async () => {
      let song = await band.addSong("Village Damsel", 100, [addr1.address], [100]);
      song = await song.wait()
      let songEvent = song.events?.find(event => event.event === 'SongAdded')
      
      expect(songEvent.args.songId.toString()).to.equal('0')
      expect(songEvent.args.name).to.equal("Village Damsel")
      expect(songEvent.args.supply.toString()).to.equal('100')
    })
    
    it("get song's NFT", async () => {
      let song = await band.addSong("Village Damsel", 100, [addr1.address], [100]);
      song = await song.wait()
      let songEvent = song.events?.find(event => event.event === 'SongAdded')
      
      let nft = await songMint.uri(songEvent.args.songId.toNumber())
      
      expect(nft).to.equal('data:application/json;base64,eyJuYW1lIjoiVmlsbGFnZSBEYW1zZWwiLCAiZGVzY3JpcHRpb24iOiJTb25nIE5GVCIsICJpbWFnZV9kYXRhIjogImRhdGE6aW1hZ2Uvc3ZnK3htbDtiYXNlNjQsUEhOMlp5QjRiV3h1Y3owbmFIUjBjRG92TDNkM2R5NTNNeTV2Y21jdk1qQXdNQzl6ZG1jbklIQnlaWE5sY25abFFYTndaV04wVW1GMGFXODlKM2hOYVc1WlRXbHVJRzFsWlhRbklIWnBaWGRDYjNnOUp6QWdNQ0F6TlRBZ016VXdKejQ4YzNSNWJHVStMbUpoYzJVZ2V5Qm1hV3hzT2lCaWJHRmphenNnWm05dWRDMW1ZVzFwYkhrNklFbHVkR1Z5T3lCbWIyNTBMWE5wZW1VNklERTBjSGc3SUgwOEwzTjBlV3hsUGp4eVpXTjBJSGRwWkhSb1BTY3hNREFsSnlCb1pXbG5hSFE5SnpFd01DVW5JR1pwYkd3OUozZG9hWFJsSnlBdlBqeDBaWGgwSUhnOUp6VXdKU2NnZVQwbk5UQWxKeUJqYkdGemN6MG5ZbUZ6WlNjZ1pHOXRhVzVoYm5RdFltRnpaV3hwYm1VOUoyMXBaR1JzWlNjZ2RHVjRkQzFoYm1Ob2IzSTlKMjFwWkdSc1pTYytWbWxzYkdGblpTQkVZVzF6Wld3OEwzUmxlSFErUEM5emRtYysifQ==')
    })
    
    it("get ownership", async () => {
      let member = await band.connect(addr1).addMember(addr2.address)
      member = await member.wait()
      let memberEvent = member.events?.find(event => event.event === 'MemberAdded')
      
      let song = await band.addSong("Village Damsel", 100, [addr1.address, addr2.address], [50, 50]);
      song = await song.wait()
      let songEvent = song.events?.find(event => event.event === 'SongAdded')

      let ownershipAddr2 = await band.getOwnership(songEvent.args.songId.toNumber(), addr2.address)
      expect(ownershipAddr2.toNumber()).to.equal(50)
    })
    
    it("add a new member", async () => {      
      let member = await band.connect(addr1).addMember(addr2.address)
      member = await member.wait()
      let memberEvent = member.events?.find(event => event.event === 'MemberAdded')

      expect(memberEvent.args.owner).to.equal(addr2.address)
    })
    
  })

  describe("BandFactory", async () => {
    it("creates a new band", async () => {
      let newBand = await bandFactory.create("Indian Ocean")
      newBand = await newBand.wait()
      let newBandEvent = newBand.events?.find(event => event.event === 'BandCreated')

      expect(newBandEvent.args.band.length).to.equal(42)
    })
    
    it("gets all bands created by sender", async () => {
      let newBand = await bandFactory.create("Indian Ocean")
      newBand = await newBand.wait()
      let newBandEvent = newBand.events?.find(event => event.event === 'BandCreated')

      let bands = await bandFactory.getAllBands()
      expect(bands.length).to.equal(1)
      expect(bands[0]).to.equal(newBandEvent.args.band)
    })
  })
});
