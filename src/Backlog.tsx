import * as backlogjs from 'backlog-js';
import { h, Properties } from 'hastscript';
import Async from 'react-async';
import { format } from 'timeago.js';
import type { Plugin } from 'unified';
import { Node } from 'unist';
import { visit } from 'unist-util-visit';

export const Backlog = (Tag: React.FunctionComponent<any>): React.FunctionComponent<any> => {
  const keyName = 'BACKLOG_API_KEY';
  return ({ children, ...props }) => {
    const save = () => {
      // e.preventDefault();
      const { value } = document.querySelector('#backlogApiKey') as HTMLInputElement;
      localStorage.setItem(keyName, value);
      // reload
      window.location.reload();
    };

    try {
      const { node } = props;
      const { host, ...params } = JSON.parse(node.properties.title);
      if (!params.backlog) {
        return (
          <Tag {...props}>{children}</Tag>
        );
      }
      const apiKey = localStorage.getItem(keyName);
      if (!apiKey) {
        return (
          <>
            <p>Backlog APIキーを取得してください</p>
            <div className="mb-3">
              <label htmlFor="backlogApiKey" className="form-label">APIキー</label>
              <input
                type="password"
                className="form-control"
                id="backlogApiKey"
                placeholder="APIキー"
              />
            </div>
            <div className="mb-3">
              <button
                type="submit"
                className="btn btn-primary"
                onClick={save}
              >保存</button>
            </div>
          </>
        );
      }
      if (!host) {
        return (<>hostパラメータは必須です</>);
      }
      const backlog = new backlogjs.Backlog({ host, apiKey });
      const getProjects = ({ params }: any) => {
        return backlog.getProjects(params);
      };

      const getIssues = ({ params }: any) => {
        return backlog.getIssues(params);
      };

      const deleteApiKey = () => {
        localStorage.removeItem(keyName);
        window.location.reload();
      };

      const changeStatus = async(issue: backlogjs.Entity.Issue.Issue, statusId: number) => {
        await backlog.patchIssue(issue.id, {
          statusId,
        });
        window.location.reload();
      };

      const deleteButton = () => {
        return (
          <div className="d-flex justify-content-end">
            <button
              className="btn btn-warning btn-sm"
              onClick={deleteApiKey}
            >トークン削除</button>
          </div>
        );
      };

      switch (children.toUpperCase()) {
        case 'PROJECTS': {
          // const getProjects = (params) => {backlog.GetProjectsParams(params)}
          return (<>
            <Async promiseFn={getProjects} params={params}>
              {({ data, error, isPending }) => {
                if (isPending) return 'Loading...';
                if (error) return `Something went wrong: ${error.message}`;
                if (data) {
                  return (<>
                    {deleteButton()}
                    <table className="table">
                      <thead>
                        <tr>
                          <td>名前</td>
                          <td>Wiki</td>
                          <td>ファイル共有</td>
                          <td>Git</td>
                          <td>アーカイブ</td>
                        </tr>
                      </thead>
                      <tbody>
                        { data.map((project, i) => (
                          <tr
                            key={i}
                          >
                            <td>
                              <a
                                href={`https://${host}/projects/${project.id}`} target='_blank'
                              >{ project.name }</a>
                            </td>
                            <td>{ project.useWiki ? '✓' : '' }</td>
                            <td>{ project.useFileSharing ? '✓' : '' }</td>
                            <td>{ project.useGit ? '✓' : '' }</td>
                            <td>{ project.archived ? '✓' : '' }</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </>
                  );
                }
              }}
            </Async>
          </>);
        }
        case 'ISSUES': {
          return (<>
            <Async promiseFn={getIssues} params={params}>
              {({ data, error, isPending }) => {
                if (isPending) return 'Loading...';
                if (error) return `Something went wrong: ${error.message}`;
                if (data) {
                  return (<>
                    {deleteButton()}
                    <table className="table">
                      <thead>
                        <tr>
                          <td>名前</td>
                          <td>ステータス</td>
                          <td>アサイン</td>
                          <td>期限</td>
                          <td>アクション</td>
                        </tr>
                      </thead>
                      <tbody>
                        { data.map((issue, i) => (
                          <tr
                            key={i}
                          >
                            <td><a
                              href={`https://${host}/view/${issue.issueKey}`} target='_blank'
                            >
                              { issue.summary }
                            </a></td>
                            <td>{ issue.status.name }</td>
                            <td>{ issue.assignee?.name }</td>
                            <td>{ issue.dueDate ? (new Date(issue.dueDate)).toLocaleDateString() : '' }</td>
                            <td>
                              { issue.status.id === 1 && <>
                                <svg
                                  xmlns="http://www.w3.org/2000/svg"
                                  onClick={() => changeStatus(issue, 2)}
                                  width="24px" height="24px" viewBox="0 0 24 24">
                                  <path fill="#fff" d="M14.3 21.7c-.7.2-1.5.3-2.3.3c-5.5 0-10-4.5-10-10S6.5 2 12 2c1.3 0 2.6.3 3.8.7l-1.6 1.6c-.7-.2-1.4-.3-2.2-.3c-4.4 0-8 3.6-8 8s3.6 8 8 8c.4 0 .9 0 1.3-.1c.2.7.6 1.3 1 1.8M7.9 10.1l-1.4 1.4L11 16L21 6l-1.4-1.4l-8.6 8.6zM18 14v3h-3v2h3v3h2v-3h3v-2h-3v-3z" />
                                </svg>
                              </>}
                              { issue.status.id === 2 && <>
                                <svg
                                  xmlns="http://www.w3.org/2000/svg"
                                  width={24} height={24}
                                  onClick={() => changeStatus(issue, 3)}
                                  viewBox="0 0 24 24">
                                  <path fill="currentColor"
                                    d="m9.55 18l-5.7-5.7l1.425-1.425L9.55 15.15l9.175-9.175L20.15 7.4z"></path>
                                </svg>
                              </>}
                              { issue.status.id === 3 && <>
                                <svg
                                  xmlns="http://www.w3.org/2000/svg"
                                  width="24px" height="24px"
                                  onClick={() => changeStatus(issue, 4)}
                                  viewBox="0 0 1024 1024">
                                  <path
                                    fill="#fff"
                                    d={'M280.768 753.728L691.456 167.04a32 32 0 1 1 52.416 36.672L314.24 817.472a32 32 0 0 1-45.44 7.296l-230.4-172.8a32 32 0 0 1 38.4-51.2zM736 448a32 32 0 1 1 0-64h192a32 32 0 1 1 0 64zM608 640a32 32 0 0 1 0-64h319.936a32 32 0 1 1 0 64zM480 832a32 32 0 1 1 0-64h447.936a32 32 0 1 1 0 64z'}
                                  />
                                </svg>
                              </>}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </>
                  );
                }
              }}
            </Async>
          </>);
        }
      }
      // your code here
      // return <>Hello, GROWI!</>;
    }
    catch (err) {
      // console.error(err);
    }
    // Return the original component if an error occurs
    return (
      <Tag {...props}>{children}</Tag>
    );
  };
};

interface GrowiNode extends Node {
  name: string;
  data: {
    hProperties?: Properties;
    hName?: string;
    hChildren?: Node[] | { type: string, value: string, url?: string }[];
    [key: string]: any;
  };
  type: string;
  attributes: {[key: string]: string}
  children: GrowiNode[] | { type: string, value: string, url?: string }[];
  value: string;
  title?: string;
  url?: string;
}


export const remarkPlugin: Plugin = () => {
  return (tree: Node) => {
    // You can use 2nd argument for specific node type
    // visit(tree, 'leafDirective', (node: Node) => {
    // :plugin[xxx]{hello=growi} -> textDirective
    // ::plugin[xxx]{hello=growi} -> leafDirective
    // :::plugin[xxx]{hello=growi} -> containerDirective
    return visit(tree, 'leafDirective', (node: Node) => {
      const n = node as unknown as GrowiNode;
      if (n.name !== 'backlog') return;
      const data = n.data || (n.data = {});
      // Render your component
      const { value: action } = n.children[0];
      data.hName = 'a'; // Tag name
      data.hChildren = [{ type: 'text', value: action || 'projects' }]; // Children
      // Set properties
      data.hProperties = {
        title: JSON.stringify({ ...n.attributes, ...{ backlog: true } }), // Pass to attributes to the component
      };
    });
  };
};
/*
export const rehypePlugin: Plugin = () => {
  return (tree: Node) => {
    // node type is 'element' or 'text' (2nd argument)
    visit(tree, 'text', (node: Node) => {
      const n = node as unknown as GrowiNode;
      const { value } = n;
      n.value = `${value} 😄`;
    });
  };
};
*/
