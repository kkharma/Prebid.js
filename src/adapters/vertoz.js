var CONSTANTS = require('../constants.json');
var utils = require('../utils.js');
var bidfactory = require('../bidfactory.js');
var bidmanager = require('../bidmanager.js');
var adloader = require('../adloader.js');

var VertozAdapter = function VertozAdapter() {
  const BASE_URI = '//banner.vrtzads.com/vzhbidder/bid?';
  const BIDDER_NAME = 'vertoz';
  const QUERY_PARAM_KEY = 'q';

  function _callBids(params) {
    var bids = params.bids || [];

    for (var i = 0; i < bids.length; i++) {
      var bid = bids[i];
      let slotBidId = utils.getValue(bid, 'bidId');
      let cb = Math.round(new Date().getTime() / 1000);
      let vzEndPoint = BASE_URI;
      let reqParams = bid.params || {};
      let placementId = utils.getValue(reqParams, 'placementId');

      if (utils.isEmptyStr(placementId)) {
        utils.logError('missing params:', BIDDER_NAME, 'Enter valid vzPlacementId');
        return;
      }

      let reqSrc = utils.getTopWindowLocation().href;
      var vzReq = {
        _vzPlacementId: placementId,
        _rqsrc: reqSrc,
        _cb: cb,
        _slotBidId: slotBidId
      };
      let queryParamValue = JSON.stringify(vzReq);
      vzEndPoint = utils.tryAppendQueryString(vzEndPoint, QUERY_PARAM_KEY, queryParamValue);
      adloader.loadScript(vzEndPoint);
    }
  }

  $$PREBID_GLOBAL$$.vzResponse = function (vertozResponse) {
    var bidRespObj = vertozResponse;
    var bidObject;
    var reqBidObj = utils.getBidRequest(bidRespObj.slotBidId);

    if (bidRespObj.cpm) {
      bidObject = bidfactory.createBid(CONSTANTS.STATUS.GOOD, reqBidObj);
      bidObject.cpm = Number(bidRespObj.cpm);
      bidObject.ad = bidRespObj.ad + utils.createTrackPixelHtml(decodeURIComponent(bidRespObj.nurl));
      bidObject.width = bidRespObj.adWidth;
      bidObject.height = bidRespObj.adHeight;
    } else {
      let respStatusText = bidRespObj.statusText;
      bidObject = bidfactory.createBid(CONSTANTS.STATUS.NO_BID, reqBidObj);
      utils.logMessage(respStatusText);
    }

    var adSpaceId = reqBidObj.placementCode;
    bidObject.bidderCode = BIDDER_NAME;
    bidmanager.addBidResponse(adSpaceId, bidObject);
  };
  return { callBids: _callBids };
};

module.exports = VertozAdapter;
