<script lang="ts">
	import { goto } from '$app/navigation';
	// import dataset from './data.json';
	import dataset from './fakedata.json';
	import fakedata from './fakedata.json';
	import { browser } from '$app/environment';
	import type { PageData } from './$types';
	import type { Person, Filter, ExcludeFilter, LimitFilter, ShuffleFilter, SortFilter } from '.';

	// url-encoded filters loaded in +page.ts
	export let data: PageData;
	// Main regex-based query
	let query = (data.query as string) || '';
	// Pagination page, page size
	let page = 1;
	let pageSize = 50;
	// Temporary variable for creating new filters
	let newFilter: string;
	// Filtered data
	let filtered: Person[];
	// Filters loaded from data
	let filters: Filter[] = (data.filters as Filter[]) || [];

	/**
	 * Debounce that accepts a generic T that can be either ('asc' | 'desc') or a number
	 *
	 * @param node passed automatically to function by Svelte's use directive
	 * @param config
	 */
	const debounce = <T extends ('asc' | 'desc') | string | number>(
		node: Node,
		config: { delay?: number; type?: T; callback: (s: T) => void }
	) => {
		const { delay = 250, callback } = config;
		let timer: ReturnType<typeof setTimeout>;
		const handleChange = (e: any) => {
			const { value } = e.currentTarget;
			clearTimeout(timer);
			timer = setTimeout(() => {
				callback(value);
			}, delay);
		};
		node.addEventListener('input', handleChange);
		return {
			destroy() {
				node.removeEventListener('input', handleChange);
			}
		};
	};

	/**
	 * Object.keys returns `string[]` and not `keyof Object`, so we need this little helper
	 * so TypeScript doesn't yell at us.
	 */
	const getKeys = Object.keys as <T extends object>(obj: T) => Array<keyof T>;

	/**
	 * We can't use TypeScript in Sveltes html sections because of how preprecessors work,
	 * so we need this helper to assert that value is a `LimitHelper`
	 * @param value
	 */
	const filter = {
		isLimit: (value: Filter): value is LimitFilter => {
			return value.type === 'limit';
		},
		isExclude: (value: Filter): value is ExcludeFilter => {
			return value.type === 'exclude';
		},
		isSort: (value: Filter): value is SortFilter => {
			return value.type === 'sort';
		}
	};

	const shuffle = (a: any[]) => {
		let j, x, i;
		for (i = a.length - 1; i > 0; i--) {
			j = Math.floor(Math.random() * (i + 1));
			x = a[i];
			a[i] = a[j];
			a[j] = x;
		}
		return a;
	};

	/**
	 * Add a new filter based on if `newFilter` is a `limit` or `sort` filter.
	 * At the end we assign `filters` to itself because Svelte doesn't detect
	 * mutation through methods like `push()`.
	 */
	const addFilter = () => {
		if (newFilter.endsWith('limit')) {
			filters.push({
				type: 'limit',
				filter: {
					// Remove the limit | sort suffix
					key: newFilter.replace(' limit', '') as keyof Person,
					max: 100,
					min: 0
				}
			});
		} else if (newFilter.endsWith('sort')) {
			filters.push({
				type: 'sort',
				filter: {
					key: newFilter.replace(' sort', '') as keyof Person,
					order: 'asc'
				}
			});
		} else if (newFilter === 'exclude letters') {
			filters.push({
				type: 'exclude',
				filter: {
					type: 'letter',
					value: ''
				}
			});
		} else if (newFilter === 'exclude prefixes') {
			filters.push({
				type: 'exclude',
				filter: {
					type: 'prefix',
					value: ''
				}
			});
		} else if (newFilter === 'exclude suffixes') {
			filters.push({
				type: 'exclude',
				filter: {
					type: 'suffix',
					value: ''
				}
			});
		} else if (newFilter === 'shuffle') {
			filters.push({
				type: 'shuffle'
			});
		}
		filters = filters;
	};

	const removeFilter = (i: number) => {
		filters.splice(i, 1);
		filters = filters;
	};

	/**
	 * Reactive block that gets re-run whenever a variable used inside chages.
	 */
	$: {
		// We rebuild the regex from the query
		const regex = new RegExp(query, 'i');
		// And filter the dataset
		filtered = dataset.data.filter((val) => val.value.match(regex));

		filters.forEach((filter) => {
			switch (filter.type) {
				case 'limit':
					if (filter.type === 'limit')
						// Filter numbers so that `max > n > min`
						filtered = filtered.filter(
							(val) =>
								filter.filter.min < val[filter.filter.key] &&
								val[filter.filter.key] < filter.filter.max
						);
					break;
				case 'sort':
					filtered = filtered.sort((a, b) => {
						if (filter.filter.order === 'asc')
							return (a[filter.filter.key] as number) - (b[filter.filter.key] as number);
						return (b[filter.filter.key] as number) - (a[filter.filter.key] as number);
					});
					break;
				case 'exclude':
					if (filter.filter.value === '') break;
					if (filter.filter.type === 'letter') {
						const regex = new RegExp(`^[^${filter.filter.value}]+$`, 'i');
						filtered = filtered.filter((val) => regex.test(val.value));
					} else if (filter.filter.type === 'prefix') {
						filtered = filtered.filter((val) => !val.value.startsWith(filter.filter.value));
					} else if (filter.filter.type === 'suffix') {
						filtered = filtered.filter((val) => !val.value.endsWith(filter.filter.value));
					}
					break;
				case 'shuffle':
					filtered = shuffle(filtered);
					break;
			}
		});

		/** Wacky SvelteKit behaviour - this will try to run on the server in SSR mode,
		 * so to ensure this only runs on the client, we need to wrap it in `if (browser)`
		 */
		if (browser) {
			// To update search params in Kit, you use the goto fuction just like if you were navigating
			const sp = new URLSearchParams();
			if (query !== '') sp.append('query', query);
			if (filters.length !== 0) sp.append('filters', JSON.stringify(filters));
			goto(`?${sp.toString()}`, {
				keepFocus: true,
				replaceState: true,
				noScroll: true
			});
		}
	}
</script>

<!-- The bind directive works like a on:input event handler that changes that value of a variable to event.target.value -->
<label>
	Query
	<!-- Main regex-based query -->
	<input bind:value={query} />
</label>
<label>
	Page
	<!-- Pagination page -->
	<input bind:value={page} type="number" min="1" max={Math.ceil(filtered.length / pageSize)} />
</label>
<label>
	Page Size
	<!-- Pagination page size -->
	<input bind:value={pageSize} type="number" min="1" max={filtered.length} />
</label>
<p>
	<button on:click={addFilter}>Add filter</button>
	<select bind:value={newFilter}>
		<!-- loop over all the keys of the first object in the dataset, filter out non-numeric ones
      and add a limit | sort suffix  -->
		<optgroup label="Limit">
			{#each getKeys(fakedata.data[0]).filter((val) => typeof fakedata.data[0][val] === 'number') as key}
				<option>{key} limit</option>
			{/each}
		</optgroup>
		<optgroup label="Sort">
			{#each getKeys(fakedata.data[0]).filter((val) => typeof fakedata.data[0][val] === 'number') as key}
				<option>{key} sort</option>
			{/each}
		</optgroup>
		<optgroup label="Snowflake special filters">
			<option>exclude letters</option>
			<option>exclude prefixes</option>
			<option>exclude suffixes</option>
			<option>shuffle</option>
		</optgroup>
	</select>
</p>
<!-- Loop over all existing filters -->
{#each filters as f, i}
	<p>
		{f.type}
		<!-- Limit filters -->
		{#if f.type === 'limit'}
			<label>
				Max
				{f.filter.key}
				<input
					type="number"
					value="100"
					min="0"
					use:debounce={{
						// debounce is generic, but we can't provide types with ts syntax inside Sveltes HTML section. So we make a parameter of type T that then tells the rest of the fuction what type the values are.
						type: 0,
						callback: (value) => {
							if (filter.isLimit(f)) f.filter.max = value;
						}
					}}
				/>
			</label>
			<label>
				Min
				<input
					type="number"
					value="0"
					min="0"
					use:debounce={{
						type: 0,
						callback: (value) => {
							if (filter.isLimit(f)) f.filter.min = value;
						}
					}}
				/>
			</label>
		{:else if f.type === 'sort'}
			{f.filter.order}
			<select
				use:debounce={{
					type: 'asc',
					callback: (value) => {
						if (filter.isSort(f)) f.filter.order = value;
					}
				}}
			>
				<option>asc</option>
				<option>desc</option>
			</select>
		{:else if f.type === 'exclude'}
			<label>
				{f.filter.type}
				<input
					use:debounce={{
						type: '',
						callback: (value) => {
							if (filter.isExclude(f)) f.filter.value = value;
						}
					}}
				/>
			</label>
		{/if}
		<button on:click={() => removeFilter(i)}>Remove</button>
		<button
			on:click={() => {
				// In an {#each} block you can also get the index of the element in the array.
				if (i > 0) {
					filters.splice(i - 1, 0, filters.splice(i, 1)[0]);
					// Since splice mutates the array without using the assignment operator, we need to reassign the variable to itself to show Svelte this variable changes here and we need to re-render this element
					filters = filters;
				}
			}}>move up</button
		>
		<button
			on:click={() => {
				if (i + 1 < filters.length) {
					filters.splice(i + 1, 0, filters.splice(i, 1)[0]);
					filters = filters;
				}
			}}>move down</button
		>
	</p>
{/each}
<table>
	<thead>
		<tr>
			<!-- Show dataset object keys as table heads -->
			{#each getKeys(fakedata.data[0]) as key}
				<th>
					{key}
				</th>
			{/each}
		</tr>
	</thead>
	<tbody>
		<!-- Paginate the results, Svelte is fast but updating tens of thousands of DOM nodes is too much (unless we'd use a virtual list but that's not in the scope of this project. if you're interested in that, look at https://github.com/sveltejs/svelte-virtual-list written by the completely insane Rich Harris) -->
		{#if filtered.length === 0}
			<p>No results!</p>
		{:else}
			{#each filtered.slice(pageSize * (page - 1), pageSize * page) as person}
				<tr>
					{#each Object.values(person) as value}
						<td>{value}</td>
					{/each}
				</tr>
			{/each}
		{/if}
	</tbody>
</table>
