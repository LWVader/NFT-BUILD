// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {ERC1155} from "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import {ERC1155Supply} from "@openzeppelin/contracts/token/ERC1155/extensions/ERC1155Supply.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {Strings} from "@openzeppelin/contracts/utils/Strings.sol";

/// @notice 52 characters x four rarity tiers; every edition ID shares its metadata.
contract TheFeeders is ERC1155, ERC1155Supply, Ownable, ReentrancyGuard {
    using Strings for uint256;
    uint256 public constant CHARACTER_COUNT = 52;
    uint256 public constant TIER_COUNT = 4;
    uint256 public constant MAX_ID = CHARACTER_COUNT * TIER_COUNT;
    uint256[4] public caps = [uint256(30), 12, 6, 2];
    uint256[4] public prices = [uint256(0.000002 ether), 0.000005 ether, 0.00001 ether, 0.000025 ether];
    mapping(uint256 => bool) public enabled;
    string private baseMetadataURI;
    bool public mintPaused = true;

    event EditionAvailability(uint256 indexed tokenId, bool enabled);
    event MintPauseChanged(bool paused);
    event MetadataBaseUpdated(string uri);

    constructor(string memory metadataBase, address initialOwner)
        ERC1155("") Ownable(initialOwner) {
        baseMetadataURI = metadataBase;
    }

    /// @notice Character IDs 1..52; tier indices 0=Common,1=Uncommon,2=Rare,3=Legendary.
    function tokenId(uint256 character, uint256 tier) public pure returns (uint256) {
        require(character >= 1 && character <= CHARACTER_COUNT, "Invalid character");
        require(tier < TIER_COUNT, "Invalid tier");
        return (character - 1) * TIER_COUNT + tier + 1;
    }

    function tierOf(uint256 id) public pure returns (uint256) {
        require(id >= 1 && id <= MAX_ID, "Invalid token");
        return (id - 1) % TIER_COUNT;
    }

    function uri(uint256 id) public view override returns (string memory) {
        require(id >= 1 && id <= MAX_ID, "Invalid token");
        return string.concat(baseMetadataURI, id.toString(), ".json");
    }

    function remaining(uint256 id) external view returns (uint256) {
        return caps[tierOf(id)] - totalSupply(id);
    }

    function setEditionEnabled(uint256 id, bool state) external onlyOwner {
        tierOf(id);
        enabled[id] = state;
        emit EditionAvailability(id, state);
    }

    function setMintPaused(bool state) external onlyOwner {
        mintPaused = state;
        emit MintPauseChanged(state);
    }

    /// @dev Freeze metadata operationally by never calling this again after public sale.
    ///      To enforce immutability in code, deploy a version without this setter.
    function setBaseMetadataURI(string calldata newURI) external onlyOwner {
        require(bytes(newURI).length > 0, "Empty URI");
        baseMetadataURI = newURI;
        emit MetadataBaseUpdated(newURI);
    }

    function mint(uint256 id, uint256 quantity) external payable nonReentrant {
        require(!mintPaused, "Mint paused");
        require(enabled[id], "Edition unavailable");
        require(quantity > 0 && quantity <= 10, "Invalid quantity");
        uint256 tier = tierOf(id);
        require(totalSupply(id) + quantity <= caps[tier], "Sold out");
        require(msg.value == prices[tier] * quantity, "Incorrect payment");
        _mint(msg.sender, id, quantity, "");
    }

    function withdraw(address payable recipient) external onlyOwner nonReentrant {
        require(recipient != address(0), "Zero recipient");
        (bool success,) = recipient.call{value: address(this).balance}("");
        require(success, "Withdrawal failed");
    }

    function _update(address from, address to, uint256[] memory ids, uint256[] memory values)
        internal override(ERC1155, ERC1155Supply) {
        super._update(from, to, ids, values);
    }
}
