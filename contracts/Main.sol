//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import "@openzeppelin/contracts/token/ERC1155/utils/ERC1155Holder.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "hardhat/console.sol";
import "./base64.sol";

contract SongNFT is ERC1155 {
    mapping(uint => string) private _uris;

    constructor() ERC1155("https://raw.githubusercontent.com/sk1122/interview-test/main/{}.json") {
        
    }

    modifier onlyOwner(uint tokenId, address owner) {
        require(balanceOf(owner, tokenId) != 0, "Not Owner");
        _;
    }

    function mint(address owner, uint _tokenId, uint supply, string calldata _uri) public {
        _mint(owner, _tokenId, supply, "");
        setTokenURI(_tokenId, _uri, owner);
    }

    function uri(uint _tokenId) override public view returns(string memory) {
        return _uris[_tokenId];
    }

    function setTokenURI(uint _tokenId, string calldata _uri, address _owner) public onlyOwner(_tokenId, _owner) {
        _uris[_tokenId] = _uri;
    }
}

contract BandFactory {
    mapping(address => address[]) bands;

    event BandCreated(address band);

    function create(string calldata bandName) public {
        Band bandss = new Band(bandName, address(0xd9145CCE52D386f254917e481eB44e9943F39138));
        address band = address(bandss);
        bands[msg.sender].push(band);

        emit BandCreated(band);
    }

    function getAllBands() public view returns (address[] memory _bands) {
        _bands = bands[msg.sender];
    }
}

contract Band is ERC1155Holder {
    
    string bandName;

    struct Song {
        string name;
        mapping(address => uint) ownership;
        uint nft;
        uint supply;
    }

    mapping(address => bool) public isMember;
    Song[] public songs;
    SongNFT nftContract;

    event SongAdded(uint songId, string name, uint supply, address[] adrs, uint[] percent);
    event MemberAdded(address owner);

    modifier anMember() {
        require(isMember[msg.sender], "Not an Member");
        _;
    }

    modifier allAnMember(address[] calldata adrs) {
        for(uint i=0;i<adrs.length;i++) {
            require(isMember[adrs[i]], "Address Not found");
        }
        _;
    }

    modifier percent100(uint [] calldata percent) {
        uint total = 0;

        for(uint i=0;i<percent.length;i++) {
            total += percent[i];
        }

        require(total == 100, "Total Percent should be 100");
        _;
    }

    constructor(string memory _bandName, address _nftContract) {
        bandName = _bandName;
        isMember[msg.sender] = true;

        nftContract = SongNFT(_nftContract);
    }

    function deposit() public payable {
        require(msg.value > 0, "Send Some More");
    }

    function getTokenURI(string memory name, string memory desc) public pure returns (string memory finalJSON) {
        string memory baseSVG = "<svg xmlns='http://www.w3.org/2000/svg' preserveAspectRatio='xMinYMin meet' viewBox='0 0 350 350'><style>.base { fill: black; font-family: Inter; font-size: 14px; }</style><rect width='100%' height='100%' fill='white' /><text x='50%' y='50%' class='base' dominant-baseline='middle' text-anchor='middle'>";

        string memory svg = Base64.encode(bytes(string(abi.encodePacked(baseSVG, name, "</text></svg>"))));
        string memory finalSVG = string(abi.encodePacked("data:image/svg+xml;base64,", svg));
        
        string memory json = Base64.encode(bytes(string(abi.encodePacked('{"name":"', name, '", "description":"', desc, '", "image_data": "', bytes(finalSVG), '"}'))));
        finalJSON = string(abi.encodePacked("data:application/json;base64,", json));
    }

    function addSong(string memory name, uint supply, address[] calldata adrs, uint[] calldata percent) public anMember allAnMember(adrs) percent100(percent) {
        require(adrs.length == percent.length, "Not Equal");

        Song storage song = songs.push();

        for(uint i=0;i<adrs.length;i++) {
            song.ownership[adrs[i]] = percent[i];
        }
        
        song.name = name;
        song.supply = supply;

        string memory _uri = getTokenURI(name, "Song NFT");
        nftContract.mint(address(this), songs.length - 1, supply, _uri);
        song.nft = songs.length - 1;

        emit SongAdded(song.nft, song.name, song.supply, adrs, percent);
    }

    function getSongNFT(uint songId) public view returns(string memory) {
        return nftContract.uri(songId);
    }

    function getOwnership(uint songId, address adrs) public view returns (uint) {
        return songs[songId].ownership[adrs];
    }

    function addMember(address adrs) public anMember {
        isMember[adrs] = true;
        emit MemberAdded(adrs);
    }
}