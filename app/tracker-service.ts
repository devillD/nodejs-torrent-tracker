import AnnounceParams from './announce-params';
import TorrentStore from './torrent-store';
import MemoryTorrentStore from './memory-torrent-store';
import Torrent from './torrent';
import Event from './event';
import AnnounceParamsValidator from './announce-params-validator';
import AnnounceResponse from './announce-response';
import constants from './tracker-constants';

export default class TrackerService {
  private torrentStore: TorrentStore;

  constructor () {
    this.torrentStore = new MemoryTorrentStore();
  }

  announce(params: AnnounceParams): AnnounceResponse {
    var torrent;
    try {
      new AnnounceParamsValidator(params).validate();

      torrent = this.torrentStore.getTorrent(params.infoHash);
      this._processEvent(params, torrent);

      return {
        complete: torrent.getComplete(),
        incomplete: torrent.getIncomplete(),
        interval: constants.announceInterval,
        peers: torrent.getPeers(params.isCompact),
      };
    } catch (err) {
      return {
        'failure reason': err.message
      };
    }
  }

  private _processEvent(params: AnnounceParams, torrent: Torrent) {
    if (params.event === Event.stopped) {
      torrent.removePeer(params.peerId);
    } else {
      torrent.setPeer({
        peerId: params.peerId,
        ip: params.ip,
        port: params.port,
        left: params.left,
      });
    }
    this.torrentStore.saveTorrent(torrent);
  }
}
